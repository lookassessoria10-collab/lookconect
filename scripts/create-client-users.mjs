import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.DEFAULT_CLIENT_PASSWORD || "123456";

const clientUsers = [
  { email: "cardiocenter@lookassessoria.com", client: "Cardiocenter", group: "Social media 1" },
  { email: "instituto@lookassessoria.com", client: "Instituto Landim", group: "Social media 1" },
  { email: "il@lookassessoria.com", client: "IL Distribuidora", group: "Social media 2" },
  { email: "lucas@lookassessoria.com", client: "Lucas Fraga", group: "Social media 2" },
  { email: "daniela@lookassessoria.com", client: "Daniela Moura", group: "Social media 1" },
  { email: "faturemais@lookassessoria.com", client: "Fature Mais", group: "Social media 1" },
  { email: "luanda@lookassessoria.com", client: "Luanda", group: "Social media 1" },
  { email: "sobramid@lookassessoria.com", client: "Sobramid", group: "Social media 1" },
  { email: "rodrigo@lookassessoria.com", client: "Rodrigo da Guarda", group: "Social media 1" },
  { email: "lazzo@lookassessoria.com", client: "Lazzo Matumbi", group: "Social media 1" },
  { email: "marcelo@lookassessoria.com", client: "Marcelo Midlej", group: "Social media 2" },
  { email: "rose@lookassessoria.com", client: "Rose Meire", group: "Social media 2" },
  { email: "senge@lookassessoria.com", client: "Senge", group: "Social media 2" },
  { email: "prime@lookassessoria.com", client: "Prime Esthetics", group: "Social media 2" },
  { email: "serenity@lookassessoria.com", client: "Serenity", group: "Social media 2" },
  { email: "isabor@lookassessoria.com", client: "Isabor", group: "Social media 2" }
];

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Configure SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local antes de rodar.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (!data.nextPage) break;
  }

  return null;
}

async function ensureAuthUser({ email, client }) {
  const metadata = { full_name: client, client_name: client, role: "client" };
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: metadata
  });

  if (!error && data.user) return data.user;

  const existing = await findUserByEmail(email);
  if (!existing) throw error;

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password: defaultPassword,
    email_confirm: true,
    user_metadata: metadata
  });

  if (updateError) throw updateError;
  return updated.user;
}

async function ensureClient({ client, group }) {
  const { data: currentClient, error: selectError } = await supabase
    .from("clients")
    .select("id,name")
    .eq("name", client)
    .maybeSingle();

  if (selectError) throw selectError;
  if (currentClient) return currentClient;

  const { data: insertedClient, error: insertError } = await supabase
    .from("clients")
    .insert({ name: client, status: "active", social_media_group: group })
    .select("id,name")
    .single();

  if (insertError) throw insertError;
  return insertedClient;
}

async function upsertPortalAccess(user, client) {
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: client.name,
      role: "client"
    }, { onConflict: "id" });

  if (profileError) throw profileError;

  const { error: accessError } = await supabase
    .from("user_client_access")
    .upsert({
      user_id: user.id,
      client_id: client.id,
      access_level: "client"
    }, { onConflict: "user_id,client_id" });

  if (accessError) throw accessError;
}

console.log(`Criando/atualizando ${clientUsers.length} acessos de clientes...`);

for (const clientUser of clientUsers) {
  try {
    const user = await ensureAuthUser(clientUser);
    const client = await ensureClient(clientUser);
    await upsertPortalAccess(user, client);
    console.log(`OK ${clientUser.email} -> ${clientUser.client}`);
  } catch (error) {
    console.error(`ERRO ${clientUser.email}: ${error.message}`);
    process.exitCode = 1;
  }
}

console.log("Processo finalizado.");
