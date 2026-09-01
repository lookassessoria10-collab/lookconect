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

const { data: profiles, error: profilesError } = await supabase
  .from("profiles")
  .select("id,email,full_name,role")
  .like("email", "%@lookassessoria.com")
  .order("email", { ascending: true });

if (profilesError) {
  console.error(profilesError.message);
  process.exit(1);
}

const { data: clients, error: clientsError } = await supabase
  .from("clients")
  .select("id,name");

if (clientsError) {
  console.error(clientsError.message);
  process.exit(1);
}

const { data: accesses, error: accessesError } = await supabase
  .from("user_client_access")
  .select("user_id,client_id,access_level");

if (accessesError) {
  console.error(accessesError.message);
  process.exit(1);
}

const clientById = new Map((clients ?? []).map((client) => [client.id, client.name]));
const accessByUser = new Map();

for (const access of accesses ?? []) {
  const current = accessByUser.get(access.user_id) ?? [];
  current.push(access);
  accessByUser.set(access.user_id, current);
}

for (const profile of profiles ?? []) {
  const userAccesses = accessByUser.get(profile.id) ?? [];
  const client = userAccesses.length
    ? userAccesses.map((access) => clientById.get(access.client_id) ?? "Cliente não encontrado").join(", ")
    : "Sem cliente";
  const level = userAccesses.length
    ? [...new Set(userAccesses.map((access) => access.access_level))].join(", ")
    : "Sem acesso";
  console.log(`${profile.email} | ${profile.full_name} | ${profile.role} | ${client} | ${level}`);
}
