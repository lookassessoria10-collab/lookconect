const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  || process.env.NEXT_PUBLIC_SUPABASE_URL
  || "https://wnpgawzvjdxevuweueou.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || "sb_publishable_Z8ud3e334gWZtUqHwul5tg_QYEYVDUU";

const LOOK_CLIENTS = [
  "Cardiocenter",
  "Daniela Moura",
  "Fature Mais",
  "Instituto Landim",
  "Luanda",
  "Sobramid",
  "Rodrigo da Guarda",
  "Lazzo Matumbi",
  "Lucas Fraga",
  "Marcelo Midlej",
  "Rose Meire",
  "Senge",
  "IL Distribuidora",
  "Prime Esthetics",
  "Serenity",
  "Isabor"
];

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function slugFromClient(value = "") {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function envKeyForClient(clientName) {
  return `CLICKUP_LIST_${normalizeText(clientName).replace(/[^A-Z0-9]+/g, "_")}`;
}

function getKnownClient(clientId) {
  const normalized = normalizeText(clientId);
  return LOOK_CLIENTS.find((client) => (
    slugFromClient(client) === clientId || normalizeText(client) === normalized
  ));
}

function getBearerToken(req) {
  const authorization = req.headers.authorization || req.headers.Authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function getConfiguredListId(clientName) {
  const slug = slugFromClient(clientName);
  const fromJson = process.env.CLICKUP_LISTS_JSON;

  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson);
      const direct = parsed[clientName] || parsed[slug] || parsed[normalizeText(clientName)];
      if (direct) return String(direct);
    } catch {
      throw new Error("CLICKUP_LISTS_JSON precisa ser um JSON valido.");
    }
  }

  return process.env[envKeyForClient(clientName)]
    || (slug === "lucas-fraga" ? process.env.CLICKUP_LUCAS_LIST_ID : null);
}

async function findListInConfiguredFolders(clientName, token) {
  const folderIds = (process.env.CLICKUP_FOLDER_IDS || process.env.CLICKUP_FOLDER_ID || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!folderIds.length) return null;

  const target = normalizeText(clientName);
  for (const folderId of folderIds) {
    const response = await fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list?archived=false`, {
      headers: { Authorization: token }
    });

    if (!response.ok) continue;

    const payload = await response.json();
    const list = (payload.lists ?? []).find((item) => {
      const current = normalizeText(item.name);
      return current === target || current.includes(target) || target.includes(current);
    });

    if (list?.id) return String(list.id);
  }

  return null;
}

function normalizeStatus(status) {
  const raw = typeof status === "string" ? status : status?.status ?? "";
  const value = raw.toLowerCase();
  if (value.includes("postado") || value.includes("publicado")) return "Publicado";
  if (value.includes("aprovado")) return "Aprovado";
  if (value.includes("cliente") || value.includes("revis")) return "Aguardando aprovacao";
  if (value.includes("produ") || value.includes("production")) return "Em producao";
  if (value.includes("planejamento") || value.includes("rascunho") || value.includes("pauta")) return "Planejado";
  return raw || "Sem status";
}

function formatDate(ms) {
  if (!ms) return { date: "--", weekday: "Sem data", iso: null, timestamp: null };
  const date = new Date(Number(ms));
  if (Number.isNaN(date.getTime())) return { date: "--", weekday: "Sem data", iso: null, timestamp: null };
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
  return {
    date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    iso: date.toISOString().slice(0, 10),
    timestamp: date.getTime()
  };
}

function mapAttachments(attachments = []) {
  return attachments
    .map((attachment) => ({
      id: attachment.id,
      title: attachment.title || attachment.filename || attachment.name || "Anexo",
      url: attachment.url || attachment.url_w_query,
      mimeType: attachment.mimetype,
      extension: attachment.extension,
      isImage: attachment.mimetype?.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(attachment.extension)
    }))
    .filter((attachment) => attachment.url);
}

function mapTask(task) {
  const normalizedStatus = normalizeStatus(task.status);
  const dateInfo = formatDate(task.due_date || task.start_date || task.date_updated);
  const upperName = normalizeText(task.name ?? "");
  const isAction = upperName.startsWith("ACAO")
    || upperName.includes("| ACAO");

  return {
    id: task.id,
    title: task.name,
    status: normalizedStatus,
    originalStatus: typeof task.status === "string" ? task.status : task.status?.status,
    date: dateInfo.date,
    weekday: dateInfo.weekday,
    dateISO: dateInfo.iso,
    timestamp: dateInfo.timestamp,
    url: task.url,
    attachments: mapAttachments(task.attachments),
    assignees: task.assignees?.map((person) => person.username).filter(Boolean) ?? [],
    type: isAction ? "action" : "content",
    value: normalizedStatus === "Publicado" ? 100 : normalizedStatus === "Aprovado" ? 86 : normalizedStatus === "Aguardando aprovacao" ? 68 : 42
  };
}

async function fetchTaskDetail(taskId, token) {
  const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
    headers: { Authorization: token }
  });

  if (!response.ok) return null;
  return response.json();
}

function isWithinNextSevenDays(task) {
  if (!task.timestamp) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return task.timestamp >= start.getTime() && task.timestamp <= end.getTime();
}

function sortPlanning(a, b) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const aTime = a.timestamp ?? 0;
  const bTime = b.timestamp ?? 0;
  const aFuture = aTime >= startMs;
  const bFuture = bTime >= startMs;
  if (aFuture !== bFuture) return aFuture ? -1 : 1;
  if (aFuture && bFuture) return aTime - bTime;
  return bTime - aTime;
}

function toPost(task) {
  return {
    id: task.id,
    date: task.date,
    weekday: task.weekday,
    dateISO: task.dateISO,
    title: task.title,
    status: task.status,
    url: task.url,
    attachments: task.attachments ?? []
  };
}

async function ensureCanAccessClient(req, clientId) {
  const token = getBearerToken(req);
  if (!token) {
    return { allowed: false, status: 401, message: "Login obrigatorio para sincronizar o ClickUp." };
  }

  const fallbackName = getKnownClient(clientId);
  if (!fallbackName) {
    return { allowed: false, status: 404, message: "Cliente nao encontrado no portal." };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return { allowed: false, status: 401, message: "Sessao Supabase invalida ou expirada." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,email,full_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { allowed: false, status: 403, message: "Perfil do portal nao encontrado para este usuario." };
  }

  const { data: clients, error: clientError } = await supabase
    .from("clients")
    .select("id,name,status")
    .eq("status", "active");

  if (clientError) {
    return { allowed: false, status: 403, message: "Nao foi possivel validar este cliente no Supabase." };
  }

  const client = (clients ?? []).find((item) => (
    slugFromClient(item.name) === clientId || normalizeText(item.name) === normalizeText(fallbackName)
  ));

  if (!client) {
    return { allowed: false, status: 404, message: "Cliente ativo nao encontrado no Supabase." };
  }

  if (profile.role === "admin_master") {
    return { allowed: true, profile, client };
  }

  const { data: access, error: accessError } = await supabase
    .from("user_client_access")
    .select("client_id,access_level")
    .eq("user_id", userData.user.id)
    .eq("client_id", client.id)
    .maybeSingle();

  if (accessError || !access) {
    return { allowed: false, status: 403, message: "Este usuario nao tem permissao explicita para sincronizar este cliente." };
  }

  return { allowed: true, profile, client };
}

async function fetchClickUpTasks(clientName) {
  const token = process.env.CLICKUP_TOKEN;
  if (!token) {
    throw new Error("CLICKUP_TOKEN nao configurado na Vercel.");
  }

  const listId = getConfiguredListId(clientName) || await findListInConfiguredFolders(clientName, token);
  if (!listId) {
    throw new Error(`Lista do ClickUp nao configurada para ${clientName}. Cadastre ${envKeyForClient(clientName)} ou CLICKUP_LISTS_JSON.`);
  }

  const allTasks = [];
  for (let page = 0; page < 4; page += 1) {
    const url = new URL(`https://api.clickup.com/api/v2/list/${listId}/task`);
    url.searchParams.set("archived", "false");
    url.searchParams.set("include_closed", "true");
    url.searchParams.set("subtasks", "true");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: { Authorization: token }
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`ClickUp respondeu ${response.status}: ${detail.slice(0, 240)}`);
    }

    const payload = await response.json();
    const tasks = payload.tasks ?? [];
    allTasks.push(...tasks);
    if (tasks.length < 100) break;
  }

  let mapped = allTasks.map(mapTask);
  const upcomingCandidates = mapped
    .filter((task) => task.type === "content" && isWithinNextSevenDays(task))
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  const detailTasks = await Promise.all(
    upcomingCandidates.map(async (task) => {
      const detail = await fetchTaskDetail(task.id, token);
      return detail ? { ...task, attachments: mapAttachments(detail.attachments) } : task;
    })
  );
  const detailById = new Map(detailTasks.map((task) => [task.id, task]));
  mapped = mapped.map((task) => detailById.get(task.id) ?? task);

  const allPosts = mapped.filter((task) => task.type === "content").sort(sortPlanning).slice(0, 80).map(toPost);
  const posts = mapped
    .filter((task) => task.type === "content" && isWithinNextSevenDays(task))
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .map(toPost);

  const actions = mapped
    .filter((task) => task.type === "action")
    .slice(0, 6)
    .map((task) => ({
      id: task.id,
      label: task.title,
      value: task.value,
      status: task.status,
      url: task.url
    }));

  return {
    imported: mapped.length,
    upcomingCount: posts.length,
    posts,
    allPosts,
    actions,
    rawStatuses: [...new Set(mapped.map((task) => task.originalStatus).filter(Boolean))],
    listId,
    client: clientName,
    clientId: slugFromClient(clientName),
    syncedAt: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date())
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  const clientId = String(req.query?.clientId || req.query?.client || "lucas-fraga");
  const access = await ensureCanAccessClient(req, clientId);
  if (!access.allowed) {
    sendJson(res, access.status, { error: access.message });
    return;
  }

  try {
    sendJson(res, 200, await fetchClickUpTasks(access.client.name));
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
