import http from "node:http";
import fs from "node:fs";
import path from "node:path";

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

const PORT = Number(process.env.PORT ?? 8787);
const LUCAS_LIST_ID = process.env.CLICKUP_LUCAS_LIST_ID ?? "901108723170";

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function normalizeStatus(status) {
  const raw = typeof status === "string" ? status : status?.status ?? "";
  const value = raw.toLowerCase();
  if (value.includes("postado") || value.includes("publicado")) return "Publicado";
  if (value.includes("aprovado")) return "Aprovado";
  if (value.includes("cliente") || value.includes("revis")) return "Aguardando aprovação";
  if (value.includes("produção") || value.includes("producao")) return "Em produção";
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

function mapTask(task) {
  const normalizedStatus = normalizeStatus(task.status);
  const dateInfo = formatDate(task.due_date || task.start_date || task.date_updated);
  const upperName = task.name?.toUpperCase() ?? "";
  const isAction = upperName.startsWith("AÇÃO") || upperName.includes("| AÇÃO");

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
    value: normalizedStatus === "Publicado" ? 100 : normalizedStatus === "Aprovado" ? 86 : normalizedStatus === "Aguardando aprovação" ? 68 : 42
  };
}

function mapAttachments(attachments = []) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    title: attachment.title || attachment.filename || attachment.name || "Anexo",
    url: attachment.url || attachment.url_w_query,
    mimeType: attachment.mimetype,
    extension: attachment.extension,
    isImage: attachment.mimetype?.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(attachment.extension)
  })).filter((attachment) => attachment.url);
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

async function fetchClickUpTasks() {
  const token = process.env.CLICKUP_TOKEN;
  if (!token) {
    throw new Error("CLICKUP_TOKEN não configurado no backend local.");
  }

  const allTasks = [];
  for (let page = 0; page < 4; page += 1) {
    const url = new URL(`https://api.clickup.com/api/v2/list/${LUCAS_LIST_ID}/task`);
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

  const allPosts = mapped
    .filter((task) => task.type === "content")
    .sort(sortPlanning)
    .slice(0, 80)
    .map(toPost);

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
    listId: LUCAS_LIST_ID,
    syncedAt: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date())
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && req.url === "/api/clickup/lucas") {
    try {
      sendJson(res, 200, await fetchClickUpTasks());
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: "Rota não encontrada." });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Portal Look API em http://127.0.0.1:${PORT}`);
});
