import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  FolderOpen,
  Home,
  Layers3,
  Lock,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Upload,
  Users,
  X
} from "lucide-react";
import { metricMonths, socialMetricMonthlyRows } from "./metricsData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import "./styles.css";

const clients = [
  { client: "Lucas Fraga", plan: "Agosto 2026", content: "12", paid: "R$ 4.850", status: "Em acompanhamento" },
  { client: "Clínica Serena", plan: "Agosto 2026", content: "9", paid: "R$ 3.200", status: "Aguardando aprovação" },
  { client: "Odonto Prime", plan: "Agosto 2026", content: "15", paid: "R$ 6.100", status: "Relatório enviado" }
];

const clientMetrics = [
  { label: "Planejamentos", value: "12", hint: "itens previstos no mês", icon: CalendarDays, target: "planejamento" },
  { label: "Aprovações", value: "6", hint: "conteúdos aprovados", icon: Check, target: "aprovacoes" },
  { label: "Arquivos", value: "3", hint: "materiais disponíveis", icon: FolderOpen, target: "files" },
  { label: "Solicitações", value: "1", hint: "nova conversa", icon: MessageSquareText, target: "solicitacoes" }
];

const posts = [
  { date: "07", weekday: "Quarta", title: "Stories sobre benefícios do tratamento completo", status: "Aguardando aprovação" },
  { date: "12", weekday: "Segunda", title: "Reels: antes e depois autorizado", status: "Em produção" },
  { date: "18", weekday: "Domingo", title: "Post carrossel de dúvidas frequentes", status: "Aprovado" }
];

const actions = [
  { label: "Mapa de atração até a consulta", value: 86 },
  { label: "Revisão do caminho de agendamento", value: 68 },
  { label: "Preparação de campanha", value: 80 }
];

function buildFallbackPostsForClient(client) {
  const clientName = client?.client ?? "Cliente Look";

  return [
    { date: "07", weekday: "Quarta", title: `Conteúdo institucional para ${clientName}`, status: "Aguardando aprovação" },
    { date: "12", weekday: "Segunda", title: `Reels de autoridade - ${clientName}`, status: "Em produção" },
    { date: "18", weekday: "Domingo", title: `Post carrossel de dúvidas frequentes - ${clientName}`, status: "Planejado" }
  ];
}

function buildFallbackActionsForClient(client) {
  const clientName = client?.client ?? "Cliente Look";

  return [
    { label: `Revisar jornada de conteúdo de ${clientName}`, value: 58 },
    { label: "Organizar próximas aprovações", value: 42 },
    { label: "Preparar leitura estratégica do mês", value: 36 }
  ];
}

const defaultTrafficReport = {
  client: "Lucas Fraga",
  period: "Agosto 2026",
  status: "Publicado no portal",
  source: "Modelo Look 2026",
  updatedAt: "Atualizado hoje",
  uploadedFile: null,
  summary: "As campanhas mantiveram ritmo consistente de geração de conversas qualificadas, com custo por lead controlado e melhor resposta nos criativos de autoridade.",
  metrics: [
    { label: "Investimento", value: "R$ 4.850", hint: "+18% vs. mês anterior", tone: "dark" },
    { label: "Leads gerados", value: "268", hint: "+32% em volume", tone: "green" },
    { label: "CPL médio", value: "R$ 18,09", hint: "-11% de custo", tone: "blue" },
    { label: "Conversas qualificadas", value: "74", hint: "27,6% dos leads", tone: "mint" }
  ],
  funnel: [
    { label: "Impressões", value: "84.210", percent: 100 },
    { label: "Cliques", value: "3.894", percent: 72 },
    { label: "Leads", value: "268", percent: 42 },
    { label: "Conversas", value: "74", percent: 24 }
  ],
  campaigns: [
    { name: "Captação principal", goal: "Novos leads", spend: "R$ 2.180", result: "126 leads", cpl: "R$ 17,30", status: "Melhor campanha" },
    { name: "Remarketing", goal: "Conversas", spend: "R$ 1.240", result: "42 conversas", cpl: "R$ 29,52", status: "Escalar com cuidado" },
    { name: "Criativo autoridade", goal: "Reconhecimento", spend: "R$ 890", result: "1.186 cliques", cpl: "R$ 0,75 CPC", status: "Criativo vencedor" }
  ],
  insights: [
    "Manter verba ativa na captação principal, que concentra o melhor CPL.",
    "Transformar os criativos de autoridade em variações para Reels e Stories.",
    "Revisar atendimento dos leads frios antes de aumentar o investimento."
  ]
};

function buildTrafficReportForClient(clientName) {
  return {
    ...defaultTrafficReport,
    client: clientName,
    status: "Aguardando PDF",
    updatedAt: "Nenhum arquivo enviado",
    uploadedFile: null,
    summary: `Quando o PDF de trafego pago de ${clientName} for enviado no ADM, o cliente passa a visualizar o relatorio formatado nesta aba.`
  };
}

const adminViews = [
  ["visao", "Visão geral", Home],
  ["clientes", "Clientes", Users],
  ["planejamento", "Planejamento", CalendarDays],
  ["metricas", "Análise de métricas", BarChart3],
  ["trafego", "Tráfego pago", CircleDollarSign],
  ["relatorios", "Relatórios", FileText],
  ["integracoes", "Integrações", Settings2]
];

const socialMetricRows = [
  { client: "A VIA DA CONSCIÊNCIA", monthsFilled: 3, lastMonth: "AGOSTO", followers: 232, newFollowers: 2, reach: 22, views: 0, engagement: 10, interactions: 0, linkTaps: null, access: "Ativo" },
  { client: "ACARAJÉ DA CAROL", monthsFilled: 0, lastMonth: null, followers: null, newFollowers: null, reach: null, views: null, engagement: null, interactions: null, linkTaps: null, access: "Pendente" },
  { client: "ADOLFO STURARO", monthsFilled: 5, lastMonth: "JULHO", followers: 2740, newFollowers: 108, reach: 15211, views: 42974, engagement: 284, interactions: 643, linkTaps: 0, access: "Ativo" },
  { client: "ADRIANA SANTOS", monthsFilled: 7, lastMonth: "JULHO", followers: 4305, newFollowers: 28, reach: 1541, views: 5803, engagement: 62, interactions: 309, linkTaps: 0, access: "Ativo" },
  { client: "APTAMENTE", monthsFilled: 3, lastMonth: "MARÇO", followers: 251, newFollowers: 44, reach: 936, views: 5001, engagement: 68, interactions: 254, linkTaps: 0, access: "Ativo" },
  { client: "ARTRUS", monthsFilled: 9, lastMonth: "SETEMBRO", followers: 3498, newFollowers: 210, reach: 170015, views: 652338, engagement: 766, interactions: 1098, linkTaps: 4, access: "Ativo" },
  { client: "CARDIOCENTER", monthsFilled: 7, lastMonth: "JULHO", followers: 3561, newFollowers: 132, reach: 9335, views: 78040, engagement: 74, interactions: 103, linkTaps: 32, access: "Ativo" },
  { client: "DAIANE SOUZA", monthsFilled: 2, lastMonth: "MAIO", followers: 5328, newFollowers: 111, reach: 10002, views: 65706, engagement: 208, interactions: 285, linkTaps: 0, access: "Ativo" },
  { client: "CHAVES E MATOS ADV", monthsFilled: 3, lastMonth: "NOVEMBRO", followers: 388, newFollowers: 13, reach: 3229, views: 59, engagement: 90, interactions: 158, linkTaps: null, access: "Ativo" },
  { client: "CLIORT", monthsFilled: 9, lastMonth: "SETEMBRO", followers: 2916, newFollowers: 178, reach: 46481, views: 86780, engagement: 239, interactions: 278, linkTaps: 27, access: "Ativo" },
  { client: "DANIELA MOURA", monthsFilled: 7, lastMonth: "JULHO", followers: 17120, newFollowers: 671, reach: 54185, views: 244892, engagement: 1632, interactions: 4970, linkTaps: 11, access: "Ativo" },
  { client: "ESPAÇO FAZER MAIS", monthsFilled: 5, lastMonth: "SETEMBRO", followers: 1043, newFollowers: 23, reach: 6934, views: 28803, engagement: 29, interactions: 36, linkTaps: 6, access: "Ativo" },
  { client: "FATURE MAIS", monthsFilled: 7, lastMonth: "JULHO", followers: 367, newFollowers: 2, reach: 168, views: 1027, engagement: 21, interactions: 72, linkTaps: 0, access: "Ativo" },
  { client: "GEEMED", monthsFilled: 3, lastMonth: "MARÇO", followers: 597, newFollowers: 9, reach: 181, views: 1054, engagement: 21, interactions: 65, linkTaps: null, access: "Ativo" },
  { client: "GILVAN LANDIM", monthsFilled: 7, lastMonth: "JULHO", followers: 18102, newFollowers: 100, reach: 22983, views: 216811, engagement: 2389, interactions: 7854, linkTaps: 0, access: "Ativo" },
  { client: "IL DISTRIBUIDORA", monthsFilled: 7, lastMonth: "JULHO", followers: 6248, newFollowers: 723, reach: 26616, views: 234540, engagement: 714, interactions: 2263, linkTaps: 0, access: "Ativo" },
  { client: "IANN", monthsFilled: 5, lastMonth: "MAIO", followers: 188, newFollowers: 12, reach: 404, views: 1249, engagement: 57, interactions: 68, linkTaps: 0, access: "Ativo" },
  { client: "HENRIQUE CHAVES", monthsFilled: 3, lastMonth: "SETEMBRO", followers: 2342, newFollowers: 28, reach: 9624, views: 118, engagement: 280, interactions: 222, linkTaps: null, access: "Ativo" },
  { client: "HOSPITAL DA PLÁSTICA DA BAHIA", monthsFilled: 6, lastMonth: "SETEMBRO", followers: 10868, newFollowers: 233, reach: 15586, views: 198, engagement: 967, interactions: 316, linkTaps: null, access: "Ativo" },
  { client: "INH", monthsFilled: 8, lastMonth: "AGOSTO", followers: 967, newFollowers: 14, reach: 2893, views: 75, engagement: 134, interactions: 151, linkTaps: null, access: "Ativo" },
  { client: "INSTITUTO LANDIM", monthsFilled: 7, lastMonth: "JULHO", followers: 4014, newFollowers: 94, reach: 25002, views: 51338, engagement: 201, interactions: 313, linkTaps: 3, access: "Ativo" },
  { client: "ISABOR SANTANNA", monthsFilled: 3, lastMonth: "JULHO", followers: 1231, newFollowers: 76, reach: 9711, views: 30291, engagement: 173, interactions: 264, linkTaps: 4, access: "Ativo" },
  { client: "LAZZO MATUMBI", monthsFilled: 5, lastMonth: "AGOSTO", followers: 208559, newFollowers: 2504, reach: null, views: 173425, engagement: null, interactions: 20685, linkTaps: 0, access: "Ativo" },
  { client: "LARPLAN", monthsFilled: 0, lastMonth: null, followers: null, newFollowers: null, reach: null, views: null, engagement: null, interactions: null, linkTaps: null, access: "Pendente" },
  { client: "LUANDA RODRIGUES", monthsFilled: 7, lastMonth: "JULHO", followers: 1550, newFollowers: 27, reach: 561, views: 2918, engagement: 44, interactions: 100, linkTaps: 0, access: "Ativo" },
  { client: "LUANE MATOS", monthsFilled: 1, lastMonth: "AGOSTO", followers: 909, newFollowers: 32, reach: 31945, views: 278, engagement: 450, interactions: 588, linkTaps: null, access: "Ativo" },
  { client: "LUCAS FRAGA", monthsFilled: 7, lastMonth: "JULHO", followers: 7785, newFollowers: 241, reach: 37381, views: 90812, engagement: 596, interactions: 1252, linkTaps: 0, access: "Ativo" },
  { client: "MAISA PAMPONET", monthsFilled: 2, lastMonth: "MARÇO", followers: 11552, newFollowers: 201, reach: null, views: 91368, engagement: null, interactions: 941, linkTaps: 12, access: "Ativo" },
  { client: "LUDMILA MENDES", monthsFilled: 2, lastMonth: "OUTUBRO", followers: 5496, newFollowers: 2978, reach: 36088, views: 75648, engagement: 454, interactions: 794, linkTaps: 0, access: "Ativo" },
  { client: "MARCELO MIDLEJ", monthsFilled: 7, lastMonth: "JULHO", followers: 11835, newFollowers: 215, reach: 10688, views: 55068, engagement: 632, interactions: 1838, linkTaps: 3, access: "Ativo" },
  { client: "PRIME ESTHETICS", monthsFilled: 4, lastMonth: "JULHO", followers: 682, newFollowers: 28, reach: 13098, views: 23946, engagement: 42, interactions: 96, linkTaps: 0, access: "Ativo" },
  { client: "MASTER PELE", monthsFilled: 2, lastMonth: "MARÇO", followers: 1101, newFollowers: 46, reach: null, views: 33269, engagement: null, interactions: 242, linkTaps: 7, access: "Ativo" },
  { client: "NEUROAPTA", monthsFilled: 1, lastMonth: "JANEIRO", followers: 85, newFollowers: 4, reach: 883, views: 17, engagement: 15, interactions: 66, linkTaps: null, access: "Ativo" },
  { client: "NEUROCLÍNICA ALMIR PLESSIM", monthsFilled: 4, lastMonth: "ABRIL", followers: 709, newFollowers: 24, reach: 649, views: 1523, engagement: 100, interactions: 226, linkTaps: 0, access: "Ativo" },
  { client: "RODRIGO DA GUARDA", monthsFilled: 1, lastMonth: "JULHO", followers: 2627, newFollowers: 42, reach: 892, views: 10255, engagement: 69, interactions: 321, linkTaps: 0, access: "Ativo" },
  { client: "ROSE MEIRE", monthsFilled: 7, lastMonth: "JULHO", followers: 4970, newFollowers: 33, reach: 1794, views: 8234, engagement: 94, interactions: 289, linkTaps: 2, access: "Ativo" },
  { client: "SENGE", monthsFilled: 7, lastMonth: "JULHO", followers: 5221, newFollowers: 78, reach: 38109, views: 35950, engagement: 42, interactions: 106, linkTaps: 1, access: "Ativo" },
  { client: "SERENITY", monthsFilled: 7, lastMonth: "JULHO", followers: 354, newFollowers: 40, reach: 6413, views: 19555, engagement: 77, interactions: 125, linkTaps: 9, access: "Ativo" },
  { client: "SOBRAMID", monthsFilled: 7, lastMonth: "JULHO", followers: 700, newFollowers: 23, reach: 2963, views: 7526, engagement: 119, interactions: 225, linkTaps: 0, access: "Ativo" },
  { client: "YNTEGRA", monthsFilled: 4, lastMonth: "ABRIL", followers: 214, newFollowers: 22, reach: 2138, views: 7954, engagement: 101, interactions: 207, linkTaps: 6, access: "Ativo" }
];

function Logo() {
  return (
    <div className="logo" aria-label="Look">
      <span>LO</span>
      <span>OK</span>
    </div>
  );
}

function metricNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMetric(value) {
  if (value === null || value === undefined || value === "-") return "Sem dado";
  if (typeof value === "number") return value.toLocaleString("pt-BR");
  return value;
}

const lookAdminAccounts = [
  {
    id: "alessia",
    name: "Alessia",
    email: "alessia@lookassessoria.com",
    role: "Social media 1",
    scope: "Carteira 1",
    clients: [
      "Cardiocenter",
      "Daniela Moura",
      "Fature Mais",
      "Instituto Landim",
      "Luanda",
      "Sobramid",
      "Rodrigo da Guarda",
      "Lazzo Matumbi"
    ]
  },
  {
    id: "bianca",
    name: "Bianca",
    email: "bianca@lookassessoria.com",
    role: "Social media 2",
    scope: "Carteira 2",
    clients: [
      "Lucas Fraga",
      "Marcelo Midlej",
      "Rose Meire",
      "Senge",
      "IL Distribuidora",
      "Prime Esthetics",
      "Serenity",
      "Isabor"
    ]
  },
  {
    id: "cecilio",
    name: "Cecilio",
    email: "cecilio@lookassessoria.com",
    role: "ADM geral",
    scope: "Controle total",
    clients: []
  }
];

const requestedLookClients = lookAdminAccounts
  .filter((account) => account.id !== "cecilio")
  .flatMap((account) => account.clients);

const metricClientAliases = {
  LUANDA: "LUANDA RODRIGUES",
  ISABOR: "ISABOR SANTANNA"
};

function normalizeClientName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function slugFromClient(value) {
  return normalizeClientName(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveMetricClientName(clientName, rows = socialMetricRows) {
  const normalized = normalizeClientName(clientName);
  const target = metricClientAliases[normalized] ?? normalized;
  return rows.find((row) => normalizeClientName(row.client) === target)?.client ?? null;
}

function findSocialOwner(clientName) {
  const normalized = normalizeClientName(clientName);
  return lookAdminAccounts.find((account) => (
    account.id !== "cecilio" && account.clients.some((client) => normalizeClientName(client) === normalized)
  ));
}

function getAdminAccountByEmail(email) {
  const normalizedEmail = email?.toLowerCase();
  return lookAdminAccounts.find((account) => account.email === normalizedEmail) ?? lookAdminAccounts[2];
}

function isAdminProfile(profile) {
  return ["admin_social", "admin_master"].includes(profile?.role);
}

function filterClientsForAdmin(clients, adminId) {
  const account = lookAdminAccounts.find((item) => item.id === adminId) ?? lookAdminAccounts[2];
  if (account.id === "cecilio") return clients;

  const allowed = new Set(account.clients.map(normalizeClientName));
  return clients.filter((client) => allowed.has(normalizeClientName(client.client)) || client.ownerId === account.id);
}

function buildClientDirectory(rows = socialMetricRows) {
  return requestedLookClients.map((clientName) => {
    const owner = findSocialOwner(clientName);
    const metricClient = resolveMetricClientName(clientName, rows);
    const row = metricClient ? rows.find((item) => item.client === metricClient) : null;

    return {
      id: slugFromClient(clientName),
      client: clientName,
      status: "Ativo",
      access: "Liberado",
      lastMetricMonth: row?.lastMonth ?? "Sem dados",
      metricsCount: row?.monthsFilled ?? 0,
      followers: row?.followers ?? null,
      source: row ? "Planilha 2026" : "Cadastro Look",
      owner: owner ? `${owner.name} - ${owner.role}` : "Equipe Look",
      ownerId: owner?.id ?? "cecilio",
      metricClient
    };
  });
}

function buildMetricTotals(rows) {
  const active = rows.filter((row) => row.access === "Ativo").length;
  const pending = rows.length - active;
  const followers = rows.reduce((total, row) => total + metricNumber(row.followers), 0);
  const reach = rows.reduce((total, row) => total + metricNumber(row.reach), 0);
  const topClient = [...rows].sort((a, b) => metricNumber(b.interactions) - metricNumber(a.interactions))[0];

  return { active, pending, followers, reach, topClient };
}

const defaultSyncState = {
  synced: false,
  imported: 0,
  upcoming: 0,
  lastSync: "Não sincronizado",
  syncing: false,
  source: "ClickUp"
};

function getClientFirstName(clientName = "cliente") {
  return clientName.split(" ")[0] || clientName;
}

function statusFromSupabase(value) {
  const labels = {
    active: "Ativo",
    inactive: "Antigo",
    archived: "Antigo"
  };

  return labels[value] ?? value ?? "Ativo";
}

function buildClientMetricCards(client) {
  const metricClient = client?.metricClient ?? resolveMetricClientName(client?.client ?? "");
  const row = metricClient ? socialMetricRows.find((item) => item.client === metricClient) : null;

  if (!row) return clientMetrics;

  return [
    { label: "Seguidores", value: formatMetric(row.followers), hint: row.lastMonth ? `último mês: ${row.lastMonth.toLowerCase()}` : "sem mês preenchido", icon: Users, target: "metricas" },
    { label: "Alcance", value: formatMetric(row.reach), hint: "alcance do perfil", icon: Eye, target: "metricas" },
    { label: "Visualizações", value: formatMetric(row.views), hint: "conteúdo visualizado", icon: BarChart3, target: "metricas" },
    { label: "Interações", value: formatMetric(row.interactions), hint: "ações no perfil", icon: MessageSquareText, target: "metricas" }
  ];
}

function ProgressRing({ value = 68 }) {
  return (
    <div className="ring" style={{ "--progress": `${value * 3.6}deg` }}>
      <div>
        <strong>{value}%</strong>
        <span>do mês</span>
      </div>
    </div>
  );
}

function ClientHeader({ onMenu, onNotify, client }) {
  const clientName = client?.client ?? "cliente";
  return (
    <header className="client-header">
      <button className="icon-button" onClick={onMenu} aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <div>
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1>Olá, {getClientFirstName(clientName)}. Esse é o seu mês na Look.</h1>
      </div>
      <button className="icon-button ghost" onClick={onNotify} aria-label="Notificações">
        <Bell size={19} />
      </button>
    </header>
  );
}

function Hero({ onPlan, client, stats }) {
  const planLabel = client?.lastMetricMonth && client.lastMetricMonth !== "Sem dados"
    ? `${client.lastMetricMonth.toLowerCase()} 2026`
    : "Agosto 2026";
  const dashboardStats = stats ?? {
    progress: 42,
    active: 3,
    published: 0,
    pending: 1
  };
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="hero-topline">
          <span>Planejamento - {planLabel}</span>
          <span className="pill-dark">{dashboardStats.active} em andamento</span>
        </div>
        <h2>Conteúdo, ações e aprovações em um só lugar.</h2>
        <p>Acompanhe em tempo real tudo que a Look está construindo para sua marca.</p>
        <button className="primary-light" onClick={onPlan}>
          Abrir planejamento
          <ChevronRight size={15} />
        </button>
      </div>
      <ProgressRing value={dashboardStats.progress} />
      <div className="hero-footer">
        <span>{dashboardStats.published} conteúdos publicados</span>
        <span>{dashboardStats.pending} aprovações pendentes</span>
      </div>
    </section>
  );
}

function TodayCard({ nextPost, onReview, onFullPlanning }) {
  return (
    <section className="today-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Próxima entrega</p>
          <h3>{nextPost?.weekday ?? "Sem entrega próxima"}</h3>
        </div>
        <CalendarDays size={18} />
      </div>
      <div className="date-row">
        <strong>{nextPost?.date ?? "--"}</strong>
        <span>{nextPost ? nextPost.status.toLowerCase() : "próximos 7 dias livres"}</span>
      </div>
      <p className="muted">{nextPost?.title ?? "Quando houver uma tarefa datada no ClickUp, ela aparecerá aqui para o cliente."}</p>
      <button className="primary-wide" onClick={nextPost ? () => onReview(nextPost) : onFullPlanning}>
        {nextPost ? "Revisar conteúdo" : "Ver planejamento completo"}
      </button>
    </section>
  );
}

function MetricGrid({ openModal, setView, metrics = clientMetrics }) {
  return (
    <section className="metric-grid">
      {metrics.map((item) => {
        const Icon = item.icon;
        const handleClick = () => item.target === "files" ? openModal("files") : setView(item.target);
        return (
          <button className="mini-card" key={item.label} onClick={handleClick}>
            <span className="mini-icon">
              <Icon size={16} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
            <b>{item.value}</b>
          </button>
        );
      })}
    </section>
  );
}

function SyncNotice({ syncState }) {
  return (
    <section className="sync-notice">
      <div>
        <p className="eyebrow">Sincronizado com ClickUp</p>
        <strong>{syncState.upcoming} conteúdo(s) nos próximos 7 dias</strong>
      </div>
      <span>{syncState.imported} no total</span>
    </section>
  );
}

function Publications({ posts, onPost, onFullPlanning }) {
  const [tab, setTab] = useState("Planejado");
  const visiblePosts = posts.filter((post) => {
    if (tab === "Planejado") return post.status !== "Aprovado";
    if (tab === "Aprovado") return post.status === "Aprovado";
    return post.status === "Aprovado";
  });

  return (
    <section className="white-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Calendário de conteúdo</p>
          <h3>Próximos 7 dias</h3>
        </div>
        <button className="text-action" onClick={onFullPlanning}>Ver completo</button>
      </div>
      <div className="tabs">
        {["Planejado", "Aprovado", "Publicado"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="post-list">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <button className="post-row" key={post.title} onClick={() => onPost(post)}>
            <div className="post-date">
              <strong>{post.date}</strong>
              <span>{post.weekday}</span>
            </div>
            <div>
              <h4>{post.title}</h4>
              <p>
                {post.status}
                {post.attachments?.length ? <span className="attachment-pill"><Paperclip size={12} /> {post.attachments.length}</span> : null}
              </p>
            </div>
            <ChevronRight size={17} />
          </button>
        )) : (
          <div className="empty-state">
            <strong>Nenhuma publicação nesta aba</strong>
            <span>Use “Ver completo” para consultar o planejamento inteiro.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressActions({ actions, onAction }) {
  return (
    <section className="white-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Além do conteúdo</p>
          <h3>Ações em acompanhamento</h3>
        </div>
        <BarChart3 size={18} />
      </div>
      <div className="bars">
        {actions.map((action) => (
          <button className="bar-item" key={action.label} onClick={() => onAction(action)}>
            <div>
              <span>{action.label}</span>
              <strong>{action.value}%</strong>
            </div>
            <i>
              <em style={{ width: `${action.value}%` }} />
            </i>
          </button>
        ))}
      </div>
    </section>
  );
}

function TrafficReport({ report, adminPreview = false }) {
  return (
    <section className={adminPreview ? "traffic-report admin-preview" : "traffic-report"}>
      <div className="traffic-hero">
        <div>
          <p className="eyebrow">Resultado de tráfego pago</p>
          <h3>{report.client}</h3>
          <span>{report.period} - {report.status}</span>
        </div>
        <div className="traffic-badge">
          <BarChart3 size={18} />
          <strong>{report.metrics[2].value}</strong>
          <small>CPL médio</small>
        </div>
      </div>

      <div className="traffic-meta">
        <span>{report.source}</span>
        <strong>{report.updatedAt}</strong>
      </div>

      <p className="traffic-summary">{report.summary}</p>

      <div className="traffic-kpis">
        {report.metrics.map((metric) => (
          <article key={metric.label} className={`traffic-kpi ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.hint}</small>
          </article>
        ))}
      </div>

      <div className="traffic-grid">
        <section className="traffic-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">Funil</p>
              <h3>Do anúncio à conversa</h3>
            </div>
          </div>
          <div className="traffic-funnel">
            {report.funnel.map((step) => (
              <div key={step.label}>
                <span>{step.label}</span>
                <strong>{step.value}</strong>
                <i><em style={{ width: `${step.percent}%` }} /></i>
              </div>
            ))}
          </div>
        </section>

        <section className="traffic-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">Leitura Look</p>
              <h3>Próximos movimentos</h3>
            </div>
          </div>
          <div className="traffic-insights">
            {report.insights.map((insight) => (
              <article key={insight}>
                <Check size={15} />
                <span>{insight}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="traffic-block">
        <div className="section-title">
          <div>
            <p className="eyebrow">Campanhas</p>
            <h3>Performance por frente</h3>
          </div>
        </div>
        <div className="traffic-campaigns">
          {report.campaigns.map((campaign) => (
            <article key={campaign.name}>
              <div>
                <strong>{campaign.name}</strong>
                <span>{campaign.goal}</span>
              </div>
              <b>{campaign.spend}</b>
              <b>{campaign.result}</b>
              <small>{campaign.cpl}</small>
              <em>{campaign.status}</em>
            </article>
          ))}
        </div>
      </section>

      {report.uploadedFile && (
        <div className="traffic-file">
          <FileText size={16} />
          <span>PDF de origem: {report.uploadedFile}</span>
        </div>
      )}
    </section>
  );
}

function TrafficAdminPanel({ report, onUpload, openModal, clients, selectedClientId, onClientChange }) {
  const activeClients = clients.filter((client) => client.status === "Ativo");
  const selectedClient = activeClients.find((client) => client.id === selectedClientId) ?? activeClients[0];
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file && selectedClient) onUpload(file, selectedClient);
    event.target.value = "";
  };

  return (
    <div className="traffic-admin">
      <section className="traffic-client-picker">
        <div>
          <p className="eyebrow">Cliente do relatorio</p>
          <h3>{selectedClient?.client ?? "Nenhum cliente ativo"}</h3>
          <span>O PDF enviado abaixo sera publicado somente para este cliente.</span>
        </div>
        <label>
          <span>Escolher cliente antes do upload</span>
          <select value={selectedClient?.id ?? ""} onChange={(event) => onClientChange(event.target.value)} disabled={!activeClients.length}>
            {activeClients.length ? activeClients.map((client) => (
              <option key={client.id} value={client.id}>{client.client}</option>
            )) : <option>Nenhum cliente ativo</option>}
          </select>
        </label>
      </section>

      <label className="upload-drop" htmlFor="traffic-pdf-upload">
        <input id="traffic-pdf-upload" type="file" accept="application/pdf" onChange={handleChange} disabled={!selectedClient} />
        <Upload size={22} />
        <strong>Subir PDF de tráfego pago</strong>
        <span>Ao selecionar um PDF, o protótipo atualiza o relatório formatado que aparece para o cliente.</span>
      </label>

      <div className="traffic-admin-status">
        <article>
          <p className="eyebrow">Cliente</p>
          <strong>{report.client}</strong>
          <span>{report.period}</span>
        </article>
        <article>
          <p className="eyebrow">Arquivo</p>
          <strong>{report.uploadedFile ?? "Nenhum PDF enviado"}</strong>
          <span>{report.updatedAt}</span>
        </article>
        <button onClick={() => openModal("trafficPublished", report)}>
          <Eye size={16} /> Ver como cliente
        </button>
      </div>

      <TrafficReport report={report} adminPreview />
    </div>
  );
}

function ClientSection({ view, openModal, posts, fullPosts, actions, trafficReport }) {
  if (view === "trafego") {
    return (
      <section className="white-panel detail-panel">
        <TrafficReport report={trafficReport} />
      </section>
    );
  }

  const content = {
    acoes: {
      title: "Ações estratégicas",
      intro: "O que a equipe Look está conduzindo para melhorar captação, atendimento e conversão.",
      items: actions.map((item) => `${item.label} - ${item.value}% concluído`)
    },
    planejamento: {
      title: "Planejamento do mês",
      intro: "Conteúdos, campanhas e entregas organizados em uma visão única.",
      items: fullPosts.map((post) => `${post.dateISO ? post.dateISO.split("-").reverse().join("/") : post.date} - ${post.title}`)
    },
    aprovacoes: {
      title: "Aprovações pendentes",
      intro: "Materiais que precisam de validação do cliente antes da publicação.",
      items: ["Carrossel sobre decisão de consulta", "Roteiro de reels sobre atendimento humanizado", "Sequência de stories da semana"]
    },
    solicitacoes: {
      title: "Solicitações",
      intro: "Canal centralizado para pedidos e ajustes, sem perder demanda no WhatsApp.",
      items: ["Atualizar foto da recepção", "Pedir ajuste em legenda", "Solicitar reunião de alinhamento"]
    },
    arquivos: {
      title: "Arquivos",
      intro: "Biblioteca de materiais da clínica e documentos enviados pela Look.",
      items: ["Planejamento de agosto", "Referências visuais", "Materiais do consultório"]
    },
    mais: {
      title: "Mais opções",
      intro: "Configurações, relatórios e histórico do relacionamento com a Look.",
      items: ["Relatórios anteriores", "Dados da clínica", "Preferências de notificação"]
    }
  }[view];

  if (!content) return null;

  return (
    <section className="white-panel detail-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Área do cliente</p>
          <h3>{content.title}</h3>
        </div>
      </div>
      <p className="muted">{content.intro}</p>
      <div className="detail-list">
        {content.items.map((item) => (
          <button key={item} onClick={() => openModal(view === "arquivos" ? "files" : view === "planejamento" ? "fullPlanning" : "generic", { posts: fullPosts })}>
            <span>{item}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function BottomNav({ active, setActive }) {
  const items = [
    ["inicio", "Início", Home],
    ["acoes", "Ações", Layers3],
    ["planejamento", "", Sparkles],
    ["trafego", "Tráfego", BarChart3],
    ["arquivos", "Arquivos", FolderOpen],
    ["mais", "Mais", Settings2]
  ];
  return (
    <nav className="bottom-nav" aria-label="Navegação do cliente">
      {items.map(([key, label, Icon]) => (
        <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ClientArea({ active, setActive, openModal, openMenu, posts, fullPosts, actions, syncState, trafficReport, client }) {
  const openItem = (item) => openModal("detail", item);
  const openFullPlanning = () => openModal("fullPlanning", { posts: fullPosts, client: client?.client });
  const nextPost = posts[0];
  const metrics = buildClientMetricCards(client);
  const publishedCount = fullPosts.filter((post) => post.status === "Publicado" || post.status === "Aprovado").length;
  const pendingCount = fullPosts.filter((post) => post.status !== "Publicado" && post.status !== "Aprovado").length;
  const heroStats = {
    active: Math.max(pendingCount, actions.length, 0),
    published: publishedCount,
    pending: pendingCount,
    progress: syncState.synced
      ? Math.min(90, Math.max(20, Math.round((publishedCount / Math.max(fullPosts.length, 1)) * 100)))
      : Math.min(68, 30 + Math.min(pendingCount, 4) * 8)
  };
  const homeContent = (
    <>
      <Hero onPlan={openFullPlanning} client={client} stats={heroStats} />
      <TodayCard nextPost={nextPost} onReview={openItem} onFullPlanning={openFullPlanning} />
      {syncState.synced && <SyncNotice syncState={syncState} />}
      <MetricGrid openModal={openModal} setView={setActive} metrics={metrics} />
      <Publications posts={posts} onPost={openItem} onFullPlanning={openFullPlanning} />
      <ProgressActions actions={actions} onAction={openItem} />
    </>
  );

  return (
    <div className="client-shell">
      <ClientHeader onMenu={openMenu} onNotify={() => openModal("notifications")} client={client} />
      <main className="client-main">
        {active === "inicio" ? (
          <div className="client-desktop-grid">
            <section className="client-primary">{homeContent}</section>
            <aside className="client-aside">
              <TodayCard nextPost={nextPost} onReview={openItem} onFullPlanning={openFullPlanning} />
              {syncState.synced && <SyncNotice syncState={syncState} />}
              <MetricGrid openModal={openModal} setView={setActive} metrics={metrics} />
              <ProgressActions actions={actions.slice(0, 3)} onAction={openItem} />
            </aside>
          </div>
        ) : (
          <ClientSection view={active} openModal={openModal} posts={posts} fullPosts={fullPosts} actions={actions} trafficReport={trafficReport} />
        )}
      </main>
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}

function AdminSidebar({ active, setActive }) {
  return (
    <aside className="admin-sidebar">
      <Logo />
      <nav>
        {adminViews.map(([key, label, Icon]) => (
          <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function AdminOverview({ openModal, setActive, syncState, clientDirectory }) {
  const activeClients = clientDirectory.filter((client) => client.status === "Ativo").length;

  return (
    <>
      <section className="admin-kpis">
        <button onClick={() => setActive("clientes")}><Users size={18} /><strong>{clientDirectory.length}</strong><span>clientes cadastrados</span></button>
        <button onClick={() => setActive("planejamento")}><ClipboardList size={18} /><strong>36</strong><span>conteúdos no mês</span></button>
        <button onClick={() => setActive("trafego")}><CircleDollarSign size={18} /><strong>R$ 14k</strong><span>mídia acompanhada</span></button>
        <button onClick={() => setActive("metricas")}><ShieldCheck size={18} /><strong>{activeClients}</strong><span>acessos ativos</span></button>
      </section>

      <section className="admin-board">
        <div className="admin-card wide">
          <div className="section-title">
            <div>
              <p className="eyebrow">Clientes</p>
              <h3>Ambientes ativos</h3>
            </div>
            <button className="round-action" onClick={() => setActive("clientes")} aria-label="Buscar clientes">
              <Search size={18} />
            </button>
          </div>
          <ClientTable openModal={openModal} clients={clientDirectory} />
        </div>

        <QuickPublish openModal={openModal} clients={clientDirectory} />
        <TeamQueue openModal={openModal} />
        <IntegrationStatus syncState={syncState} setActive={setActive} />
      </section>
    </>
  );
}

function MetricsAdminPanel({ openModal, clients }) {
  const activeClientsWithMetrics = useMemo(
    () => clients.filter((client) => client.status === "Ativo" && client.metricClient),
    [clients]
  );
  const activeMetricClientNames = useMemo(() => activeClientsWithMetrics.map((client) => client.metricClient), [activeClientsWithMetrics]);
  const displayByMetricClient = useMemo(() => new Map(activeClientsWithMetrics.map((client) => [client.metricClient, client.client])), [activeClientsWithMetrics]);
  const clientsWithMetrics = useMemo(
    () => activeClientsWithMetrics.map((client) => client.client).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [activeClientsWithMetrics]
  );
  const [selectedClient, setSelectedClient] = useState("Lucas Fraga");
  const [selectedMonth, setSelectedMonth] = useState("JULHO");
  const currentSelectedClient = clientsWithMetrics.includes(selectedClient) ? selectedClient : clientsWithMetrics[0] ?? "";
  const selectedDirectoryClient = activeClientsWithMetrics.find((client) => client.client === currentSelectedClient);
  const currentMetricClient = selectedDirectoryClient?.metricClient ?? "";
  const monthRows = useMemo(
    () => socialMetricMonthlyRows.filter((row) => row.month === selectedMonth && activeMetricClientNames.includes(row.client)),
    [selectedMonth, activeMetricClientNames]
  );
  const totals = useMemo(() => buildMetricTotals(monthRows), [monthRows]);
  const selected = monthRows.find((row) => row.client === currentMetricClient) ?? {
    client: currentMetricClient || currentSelectedClient || "Nenhum cliente ativo",
    month: selectedMonth,
    access: "Pendente",
    followers: null,
    newFollowers: null,
    losses: null,
    reach: null,
    views: null,
    engagement: null,
    interactions: null,
    linkTaps: null
  };
  const selectedDisplayName = selectedDirectoryClient?.client ?? currentSelectedClient ?? "Nenhum cliente ativo";
  const hasSelectedData = selected.access === "Ativo";
  const monthTableRows = monthRows
    .filter((row) => row.client !== selected.client)
    .sort((a, b) => metricNumber(b.interactions) - metricNumber(a.interactions))
    .slice(0, 8);
  const detailMetrics = [
    ["Seguidores", selected.followers, Users],
    ["Novos seguidores", selected.newFollowers, Plus],
    ["Perdas", selected.losses, Archive],
    ["Alcance", selected.reach, Eye],
    ["Visualizações", selected.views, BarChart3],
    ["Engajamento", selected.engagement, Sparkles],
    ["Interações", selected.interactions, MessageSquareText],
    ["Toques em links", selected.linkTaps, ExternalLink]
  ];
  const barRows = [
    ["Alcance", selected.reach],
    ["Visualizações", selected.views],
    ["Interações", selected.interactions],
    ["Engajamento", selected.engagement]
  ];
  const barMax = Math.max(1, ...barRows.map(([, value]) => metricNumber(value)));

  return (
    <div className="metrics-admin-panel clean">
      <section className="metrics-filter-card">
        <div>
          <p className="eyebrow">Filtros da análise</p>
          <h3>Selecione cliente e mês</h3>
          <span>A visão abaixo mostra somente clientes ativos e o recorte que será liberado para o perfil escolhido.</span>
        </div>
        <label>
          <span>Cliente</span>
          <select value={currentSelectedClient} onChange={(event) => setSelectedClient(event.target.value)} disabled={!clientsWithMetrics.length}>
            {clientsWithMetrics.length ? clientsWithMetrics.map((client) => <option key={client}>{client}</option>) : <option>Nenhum cliente ativo</option>}
          </select>
        </label>
        <label>
          <span>Mês</span>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
            {metricMonths.map((month) => <option key={month}>{month}</option>)}
          </select>
        </label>
      </section>

      <section className="metrics-overview compact">
        <article>
          <span>Clientes ativos no mês</span>
          <strong>{monthRows.length}</strong>
          <small>{selectedMonth.toLowerCase()}</small>
        </article>
        <article>
          <span>Acesso do perfil</span>
          <strong>{hasSelectedData ? "Ativo" : "Pendente"}</strong>
          <small>{selectedDisplayName}</small>
        </article>
        <article>
          <span>Seguidores somados</span>
          <strong>{formatMetric(totals.followers)}</strong>
          <small>base com dados no mês</small>
        </article>
        <article>
          <span>Maior interação</span>
          <strong>{displayByMetricClient.get(totals.topClient?.client) ?? totals.topClient?.client ?? "Sem dados"}</strong>
          <small>{formatMetric(totals.topClient?.interactions)} interações</small>
        </article>
      </section>

      <section className="metrics-detail clean">
        <div className="metrics-detail-head">
          <div>
            <p className="eyebrow">Recorte selecionado</p>
            <h3>{selectedDisplayName}</h3>
            <span>{selectedMonth} de 2026 - {hasSelectedData ? "dados encontrados na planilha" : "sem dados preenchidos para este mês"}</span>
          </div>
          <button onClick={() => openModal("metricAccess", { ...selected, client: selectedDisplayName })}>
            <Lock size={15} /> Organizar acesso
          </button>
        </div>

        {hasSelectedData ? (
          <>
            <div className="metrics-detail-grid">
              {detailMetrics.map(([label, value, Icon]) => (
                <article key={label}>
                  <Icon size={16} />
                  <span>{label}</span>
                  <strong>{formatMetric(value)}</strong>
                </article>
              ))}
            </div>

            <div className="metrics-bars">
              {barRows.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{formatMetric(value)}</strong>
                  <i><em style={{ width: `${Math.max(4, Math.round((metricNumber(value) / barMax) * 100))}%` }} /></i>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="metrics-empty">
            <CalendarDays size={20} />
            <strong>Sem dados para {selectedMonth.toLowerCase()}</strong>
            <span>Escolha outro mês ou mantenha o acesso como pendente até a planilha ser atualizada.</span>
          </div>
        )}

        <div className="access-map">
          <div>
            <p className="eyebrow">Acesso do cliente</p>
            <h3>{hasSelectedData ? "Liberar este recorte no login" : "Manter bloqueado no login"}</h3>
            <span>Na produção, o login do cliente receberá somente as métricas vinculadas ao próprio cadastro.</span>
          </div>
          <div className="access-pills">
            <span>{selectedMonth}</span>
            <span>Instagram</span>
            <span>{hasSelectedData ? "Liberado" : "Pendente"}</span>
          </div>
        </div>
      </section>

      <section className="metrics-month-table">
        <div className="section-title">
          <div>
            <p className="eyebrow">Clientes ativos com dados no mês</p>
            <h3>Resumo de {selectedMonth.toLowerCase()}</h3>
          </div>
        </div>
        <div>
          {monthTableRows.map((row) => (
            <button key={`${row.client}-${row.month}`} onClick={() => setSelectedClient(displayByMetricClient.get(row.client) ?? row.client)}>
              <strong>{displayByMetricClient.get(row.client) ?? row.client}</strong>
              <span>{formatMetric(row.followers)} seguidores</span>
              <span>{formatMetric(row.reach)} alcance</span>
              <span>{formatMetric(row.interactions)} interações</span>
              <b className="access-on">Ativo</b>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function IntegrationStatus({ syncState, setActive }) {
  return (
    <div className="admin-card">
      <p className="eyebrow">Integração</p>
      <h3>ClickUp</h3>
      <div className={syncState.synced ? "integration-badge online" : "integration-badge"}>
        <span>{syncState.synced ? syncState.source : "Pronto para conectar"}</span>
        <strong>{syncState.syncing ? "Sincronizando..." : syncState.synced ? syncState.lastSync : "Nenhuma sincronização"}</strong>
      </div>
      <button className="primary-wide" onClick={() => setActive("integracoes")}>
        <Settings2 size={16} /> Configurar integração
      </button>
    </div>
  );
}

function ClientTable({ openModal, clients }) {
  const previewClients = clients.slice(0, 5);

  return (
    <div className="admin-table">
      {previewClients.map((row) => (
        <button key={row.client} onClick={() => openModal("client", row)}>
          <div>
            <strong>{row.client}</strong>
            <span>{row.source} - {row.owner}</span>
          </div>
          <b>{row.metricsCount} mês(es)</b>
          <b>{row.access}</b>
          <span className={`status ${row.status.toLowerCase().replace(/\s/g, "-")}`}>{row.status}</span>
        </button>
      ))}
    </div>
  );
}

function ClientDirectoryPanel({ clients, openModal, onClientStatusChange }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const statusOptions = ["Ativo", "Em entrada", "Antigo", "Saiu", "Pendente"];
  const totals = {
    total: clients.length,
    active: clients.filter((client) => client.status === "Ativo").length,
    onboarding: clients.filter((client) => client.status === "Em entrada").length,
    historical: clients.filter((client) => ["Antigo", "Saiu"].includes(client.status)).length
  };
  const filteredClients = clients.filter((client) => {
    const matchesName = client.client.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "Todos" || client.status === statusFilter;
    return matchesName && matchesStatus;
  });

  return (
    <div className="client-directory">
      <section className="client-directory-kpis">
        <article><span>Total</span><strong>{totals.total}</strong><small>importados da planilha</small></article>
        <article><span>Ativos</span><strong>{totals.active}</strong><small>com acesso liberado</small></article>
        <article><span>Entrando</span><strong>{totals.onboarding}</strong><small>cadastros novos</small></article>
        <article><span>Antigos/saíram</span><strong>{totals.historical}</strong><small>mantidos no histórico</small></article>
      </section>

      <section className="client-directory-filters">
        <label>
          <span>Buscar cliente</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o nome do cliente" />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Todos</option>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </section>

      <section className="client-directory-table">
        <div className="client-directory-head">
          <span>Cliente</span>
          <span>Status</span>
          <span>Métricas</span>
          <span>Acesso</span>
          <span>Ações</span>
        </div>
        {filteredClients.map((client) => (
          <article key={client.id}>
            <div>
              <strong>{client.client}</strong>
              <span>{client.source} - responsável: {client.owner}</span>
            </div>
            <select value={client.status} onChange={(event) => onClientStatusChange(client.id, event.target.value)}>
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            <span>{client.lastMetricMonth} - {client.metricsCount} mês(es)</span>
            <b className={client.status === "Ativo" ? "access-on" : "access-pending"}>
              {client.status === "Ativo" ? "Liberado" : "Bloqueado"}
            </b>
            <div className="client-actions">
              <button onClick={() => openModal("client", client)} aria-label={`Editar ${client.client}`}>
                <Edit3 size={15} /> Editar
              </button>
              <button onClick={() => onClientStatusChange(client.id, "Antigo")}>
                <Archive size={15} /> Antigo
              </button>
              <button onClick={() => onClientStatusChange(client.id, "Saiu")}>
                <X size={15} /> Saiu
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function QuickPublish({ openModal, clients }) {
  return (
    <div className="admin-card">
      <p className="eyebrow">Publicação rápida</p>
      <h3>Atualizar cliente</h3>
      <label>Cliente</label>
      <select>
        {clients.slice(0, 12).map((client) => <option key={client.id}>{client.client}</option>)}
      </select>
      <label>Módulo</label>
      <select>
        <option>Planejamento de conteúdo</option>
        <option>Resultados de tráfego</option>
        <option>Solicitações</option>
      </select>
      <button className="primary-wide" onClick={() => openModal("published")}>
        <Upload size={16} /> Enviar para o portal
      </button>
    </div>
  );
}

function TeamQueue({ openModal }) {
  const queue = [
    ["Aprovar legenda do reels", Clock3],
    ["Responder solicitação", MessageSquareText],
    ["Fechar leitura semanal", BarChart3]
  ];
  return (
    <div className="admin-card">
      <p className="eyebrow">Fila da equipe</p>
      <h3>Aguardando ação</h3>
      <ul className="task-list">
        {queue.map(([item, Icon]) => (
          <li key={item}>
            <button onClick={() => openModal("task", { title: item })}>
              <Icon size={16} /> {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationsPanel({ syncState, onSync, openModal, clients, selectedClientId, onClientChange }) {
  const activeClients = clients.filter((client) => client.status === "Ativo");
  const selectedClient = activeClients.find((client) => client.id === selectedClientId) ?? activeClients[0];
  const mappedStatuses = [
    ["A fazer", "Planejado"],
    ["Em produção", "Em produção"],
    ["Revisão cliente", "Aguardando aprovação"],
    ["Publicado", "Publicado"]
  ];

  return (
    <div className="integration-panel">
      <section className="integration-hero">
        <div>
          <p className="eyebrow">Fonte operacional</p>
          <h3>ClickUp conectado ao Portal Look</h3>
          <p>O protótipo consulta a lista real LUCAS no ClickUp e transforma tarefas, status e datas em conteúdos, ações e planejamento para o cliente.</p>
        </div>
        <div className={syncState.synced ? "sync-orb online" : "sync-orb"}>
          <RefreshCw size={22} />
          <strong>{syncState.synced ? "OK" : "OFF"}</strong>
        </div>
      </section>

      <div className="integration-grid">
        <article>
          <p className="eyebrow">Banco de dados</p>
          <strong>{isSupabaseConfigured ? "Supabase configurado" : "Supabase pendente"}</strong>
          <span>{isSupabaseConfigured ? "URL e chave publica carregadas" : "Configure as variaveis VITE_"}</span>
        </article>
        <article>
          <p className="eyebrow">Workspace</p>
          <strong>Look Assessoria</strong>
          <span>Espaço: Clientes ativos</span>
        </article>
        <article>
          <p className="eyebrow">Cliente monitorado</p>
          <strong>{selectedClient?.client ?? "Nenhum cliente ativo"}</strong>
          <span>{syncState.synced ? `Lista ID ${syncState.listId ?? "conectada"}` : "Selecione e sincronize"}</span>
        </article>
        <article>
          <p className="eyebrow">Última sincronização</p>
          <strong>{syncState.syncing ? "Sincronizando..." : syncState.synced ? syncState.lastSync : "Ainda não sincronizado"}</strong>
          <span>{syncState.synced ? `${syncState.imported} tarefas importadas` : "Clique para importar os dados"}</span>
        </article>
      </div>

      <label className="client-selector">
        <span>Cliente para sincronizar</span>
        <select
          value={selectedClient?.id ?? ""}
          onChange={(event) => onClientChange(event.target.value)}
          disabled={!activeClients.length || syncState.syncing}
        >
          {activeClients.map((client) => (
            <option key={client.id} value={client.id}>{client.client}</option>
          ))}
        </select>
      </label>

      <div className="mapping-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">Mapeamento</p>
            <h3>Status do ClickUp no portal</h3>
          </div>
        </div>
        {mappedStatuses.map(([from, to]) => (
          <button key={from} onClick={() => openModal("task", { title: `${from} → ${to}` })}>
            <span>{from}</span>
            <ChevronRight size={15} />
            <strong>{to}</strong>
          </button>
        ))}
      </div>

      <button className="primary-wide sync-button" onClick={() => onSync(selectedClient)} disabled={!selectedClient || syncState.syncing}>
        <RefreshCw size={16} /> {syncState.syncing ? "Sincronizando..." : syncState.synced ? "Sincronizar novamente" : "Sincronizar ClickUp agora"}
      </button>
    </div>
  );
}

function AdminContent({ active, openModal, setActive, syncState, onSync, trafficReport, onTrafficUpload, clientDirectory, onClientStatusChange, onCreateClient, selectedTrafficClientId, onTrafficClientChange, selectedSyncClientId, onSyncClientChange }) {
  if (active === "visao") {
    return <AdminOverview openModal={openModal} setActive={setActive} syncState={syncState} clientDirectory={clientDirectory} />;
  }

  const selectedSyncClient = clientDirectory.find((client) => client.id === selectedSyncClientId) ?? clientDirectory.find((client) => client.status === "Ativo");

  const views = {
    clientes: {
      title: "Clientes cadastrados",
      intro: "Gerencie clientes da base, acessos, entrada, saída e histórico.",
      action: "Novo cliente",
      body: <ClientDirectoryPanel clients={clientDirectory} openModal={openModal} onClientStatusChange={onClientStatusChange} />
    },
    planejamento: {
      title: "Planejamento de conteúdo",
      intro: "Organize entregas, status de aprovação e calendário mensal.",
      action: "Adicionar conteúdo",
      body: <AdminList items={["Carrossel em revisão", "Reels em produção", "Stories aprovados", "Calendário de setembro em rascunho"]} openModal={openModal} />
    },
    metricas: {
      title: "Análise de métricas",
      intro: "Consolide a base por cliente e organize o que cada login poderá visualizar.",
      action: "Importar planilha",
      body: <MetricsAdminPanel openModal={openModal} clients={clientDirectory} />
    },
    trafego: {
      title: "Tráfego pago",
      intro: "Consolide investimento, leads, custo por lead e leitura estratégica.",
      action: "Subir PDF",
      body: <TrafficAdminPanel report={trafficReport} onUpload={onTrafficUpload} openModal={openModal} clients={clientDirectory} selectedClientId={selectedTrafficClientId} onClientChange={onTrafficClientChange} />
    },
    relatorios: {
      title: "Relatórios",
      intro: "Publique análises semanais e mensais para cada cliente.",
      action: "Novo relatório",
      body: <AdminList items={["Relatório semanal - Lucas Fraga", "Resumo mensal - Clínica Serena", "Análise de ROI - Odonto Prime"]} openModal={openModal} />
    },
    integracoes: {
      title: "Integrações",
      intro: "Conecte as ferramentas internas da Look e escolha o que aparece no portal do cliente.",
      action: syncState.synced ? "Sincronizar novamente" : "Sincronizar ClickUp",
      body: <IntegrationsPanel syncState={syncState} onSync={onSync} openModal={openModal} clients={clientDirectory} selectedClientId={selectedSyncClientId} onClientChange={onSyncClientChange} />
    }
  }[active];

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-head">
        <div>
          <p className="eyebrow">Painel administrativo</p>
          <h2>{views.title}</h2>
          <p>{views.intro}</p>
        </div>
        <button className="primary-admin" onClick={active === "integracoes" ? () => onSync(selectedSyncClient) : () => active === "trafego" ? document.getElementById("traffic-pdf-upload")?.click() : active === "metricas" ? openModal("metricImport") : active === "clientes" ? onCreateClient() : openModal("published")}>
          <Plus size={17} /> {views.action}
        </button>
      </div>
      {views.body}
    </section>
  );
}

function AdminList({ items, openModal }) {
  return (
    <div className="admin-list">
      {items.map((item) => (
        <button key={item} onClick={() => openModal("task", { title: item })}>
          <span>{item}</span>
          <div>
            <Eye size={16} />
            <Edit3 size={16} />
            <Send size={16} />
          </div>
        </button>
      ))}
    </div>
  );
}

function AdminAccessPanel({ activeAdminId, onAdminChange, allClients, visibleClients, currentProfile }) {
  const activeAccount = lookAdminAccounts.find((account) => account.id === activeAdminId) ?? lookAdminAccounts[2];
  const visibleActive = visibleClients.filter((client) => client.status === "Ativo").length;
  const canSwitchProfiles = !currentProfile || currentProfile.role === "admin_master";
  const accountOptions = canSwitchProfiles ? lookAdminAccounts : [activeAccount];

  return (
    <section className="admin-access-panel">
      <div>
        <p className="eyebrow">Permissao de ADM</p>
        <h3>{activeAccount.role}</h3>
        <span>{activeAccount.email}</span>
      </div>
      <label>
        <span>Visualizar painel como</span>
        <select value={activeAdminId} onChange={(event) => onAdminChange(event.target.value)} disabled={!canSwitchProfiles}>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>{account.name} - {account.role}</option>
          ))}
        </select>
      </label>
      <div className="admin-access-numbers">
        <article>
          <strong>{visibleClients.length}</strong>
          <span>clientes visiveis</span>
        </article>
        <article>
          <strong>{visibleActive}</strong>
          <span>ativos</span>
        </article>
        <article>
          <strong>{activeAdminId === "cecilio" ? allClients.length : activeAccount.clients.length}</strong>
          <span>{activeAdminId === "cecilio" ? "total Look" : activeAccount.scope}</span>
        </article>
      </div>
    </section>
  );
}

function AdminPanel({ openModal, syncState, onSync, trafficReport, onTrafficUpload, clientDirectory, onClientStatusChange, onCreateClient, currentProfile, currentAdminId, onAdminChange, onSignOut, selectedTrafficClientId, onTrafficClientChange, selectedSyncClientId, onSyncClientChange }) {
  const [active, setActive] = useState("visao");
  const activeAdminId = currentAdminId ?? "cecilio";
  const pageTitle = adminViews.find(([key]) => key === active)?.[1] ?? "Visão geral";
  const visibleClients = useMemo(() => filterClientsForAdmin(clientDirectory, activeAdminId), [clientDirectory, activeAdminId]);

  return (
    <div className="admin-shell">
      <AdminSidebar active={active} setActive={setActive} />
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Painel administrativo</p>
            <h1>{pageTitle === "Visão geral" ? "Controle o que cada cliente visualiza." : pageTitle}</h1>
          </div>
          <button className="primary-admin" onClick={() => openModal("published")}>
            <Plus size={17} /> Nova atualização
          </button>
          {onSignOut && (
            <button className="secondary-admin" onClick={onSignOut}>
              Sair
            </button>
          )}
        </header>
        <AdminAccessPanel
          activeAdminId={activeAdminId}
          onAdminChange={onAdminChange}
          allClients={clientDirectory}
          visibleClients={visibleClients}
          currentProfile={currentProfile}
        />
        <AdminContent
          active={active}
          openModal={openModal}
          setActive={setActive}
          syncState={syncState}
          onSync={onSync}
          trafficReport={trafficReport}
          onTrafficUpload={onTrafficUpload}
          clientDirectory={visibleClients}
          onClientStatusChange={onClientStatusChange}
          onCreateClient={() => onCreateClient(activeAdminId)}
          selectedTrafficClientId={selectedTrafficClientId}
          onTrafficClientChange={onTrafficClientChange}
          selectedSyncClientId={selectedSyncClientId}
          onSyncClientChange={onSyncClientChange}
        />
      </main>
    </div>
  );
}

function Modal({ type, data, onClose }) {
  const content = {
    files: {
      eyebrow: "Arquivos",
      title: "Materiais do cliente",
      intro: "Documentos organizados por prioridade e tipo.",
      body: <FileList />
    },
    planning: {
      eyebrow: "Planejamento mensal",
      title: "Agosto 2026",
      intro: `Planejamento de conteúdo e ações para ${data?.client ?? "o cliente"}.`,
      body: <PlanSummary />
    },
    fullPlanning: {
      eyebrow: "Planejamento completo",
      title: "Todos os conteúdos",
      intro: "Visão completa do planejamento vindo do ClickUp. Na tela inicial, o cliente vê apenas os próximos 7 dias.",
      body: <FullPlanningList posts={data?.posts ?? []} />
    },
    approval: {
      eyebrow: "Aprovação",
      title: "Revisar conteúdo",
      intro: "Carrossel pronto para aprovação, com legenda e direção visual alinhadas.",
      body: <ActionChoices />
    },
    notifications: {
      eyebrow: "Notificações",
      title: "Novidades da semana",
      intro: "Você tem 3 atualizações recentes no portal.",
      body: <FileList compact />
    },
    client: {
      eyebrow: "Cliente",
      title: data?.client ?? "Ambiente do cliente",
      intro: `${data?.status ?? "Em acompanhamento"} - ${data?.source ?? "Cadastro"} - acesso ${data?.access ?? "pendente"}.`,
      body: <ClientAdminPreview client={data} />
    },
    clientCreated: {
      eyebrow: "Novo cadastro",
      title: data?.client ?? "Novo cliente",
      intro: "Cliente criado como Em entrada. No banco real, aqui abriríamos o formulário completo de cadastro e permissões.",
      body: <ClientAdminPreview client={data} />
    },
    published: {
      eyebrow: "Atualização enviada",
      title: "Portal atualizado",
      intro: "A informação foi simulada como publicada para o cliente selecionado.",
      body: <ActionChoices />
    },
    syncComplete: {
      eyebrow: "ClickUp sincronizado",
      title: "Dados importados",
      intro: `${data?.imported ?? 0} tarefas reais foram lidas. A área do cliente mostra ${data?.upcoming ?? 0} conteúdo(s) dos próximos 7 dias.`,
      body: <SyncResult data={data} />
    },
    syncError: {
      eyebrow: "Falha na sincronização",
      title: "Não foi possível buscar o ClickUp",
      intro: data?.message ?? "Verifique se a API local está rodando e se o token continua válido.",
      body: <ActionChoices />
    },
    trafficUploaded: {
      eyebrow: "PDF recebido",
      title: "Relatório de tráfego atualizado",
      intro: `${data?.file ?? "O PDF"} foi processado no protótipo e publicado na aba Tráfego do cliente.`,
      body: <ActionChoices />
    },
    trafficPublished: {
      eyebrow: "Prévia do cliente",
      title: "Resultado de tráfego pago",
      intro: "Essa é a formatação que o cliente verá na aba específica de Tráfego.",
      body: <TrafficReport report={data ?? defaultTrafficReport} adminPreview />
    },
    metricImport: {
      eyebrow: "Importação de métricas",
      title: "Base pronta para segmentar clientes",
      intro: "A planilha foi estruturada como uma base por cliente. Em produção, esse upload alimenta o banco e atualiza cada login separadamente.",
      body: <ActionChoices />
    },
    metricAccess: {
      eyebrow: "Acesso do cliente",
      title: data?.client ?? "Cliente selecionado",
      intro: `${data?.access ?? "Pendente"} - o cliente verá somente as métricas da própria aba da planilha.`,
      body: <MetricAccessPreview data={data} />
    },
    task: {
      eyebrow: "Ação administrativa",
      title: data?.title ?? "Item selecionado",
      intro: "Escolha o próximo passo para continuar a gestão deste item.",
      body: <ActionChoices />
    },
    detail: {
      eyebrow: "Detalhe",
      title: data?.title ?? data?.label ?? "Item selecionado",
      intro: data?.status ?? `${data?.value ?? ""}% concluído`,
      body: <ContentDetail item={data} />
    },
    generic: {
      eyebrow: "Detalhe",
      title: "Item do portal",
      intro: "Esta área já responde ao clique e está pronta para receber dados reais.",
      body: <ActionChoices />
    }
  }[type];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={17} />
        </button>
        <p className="eyebrow">{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p className="modal-intro">{content.intro}</p>
        {content.body}
        <button className="primary-wide" onClick={onClose}>Voltar ao painel</button>
      </div>
    </div>
  );
}

function FileList({ compact = false }) {
  const files = compact
    ? ["Novo comentário em conteúdo", "Relatório semanal disponível", "Campanha atualizada"]
    : ["Planejamento de agosto", "Referências Look", "Materiais do consultório"];

  return (
    <div className="file-list">
      {files.map((file) => (
        <button key={file}>
          <FileText size={18} />
          <span>{file}<small>{compact ? "Clique para visualizar" : "Atualizado hoje"}</small></span>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}

function ContentDetail({ item }) {
  const attachments = item?.attachments ?? [];

  return (
    <div className="content-detail">
      {item?.url && (
        <a className="external-link" href={item.url} target="_blank" rel="noreferrer">
          <ExternalLink size={15} /> Abrir tarefa no ClickUp
        </a>
      )}
      <div className="attachment-section">
        <div>
          <p className="eyebrow">Anexos</p>
          <strong>{attachments.length ? `${attachments.length} arquivo(s) anexado(s)` : "Nenhum anexo encontrado"}</strong>
        </div>
        {attachments.length ? (
          <div className="attachment-grid">
            {attachments.slice(0, 6).map((attachment) => (
              <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer">
                {attachment.isImage ? <img src={attachment.url} alt={attachment.title} /> : <FileText size={22} />}
                <span>{attachment.title}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">Quando a tarefa tiver imagens, PDFs ou arquivos no ClickUp, eles aparecem aqui.</p>
        )}
      </div>
      <ActionChoices />
    </div>
  );
}

function FullPlanningList({ posts }) {
  return (
    <div className="full-planning-list">
      {posts.length ? posts.map((post) => (
        <article key={post.id ?? post.title}>
          <div>
            <strong>{post.title}</strong>
            <span>{post.dateISO ? post.dateISO.split("-").reverse().join("/") : post.date} - {post.status}</span>
          </div>
          {post.attachments?.length ? <b><Paperclip size={13} /> {post.attachments.length}</b> : <b>Sem anexo</b>}
        </article>
      )) : (
        <div className="empty-state">
          <strong>Nenhum item importado ainda</strong>
          <span>Sincronize o ClickUp no ADM para preencher o planejamento completo.</span>
        </div>
      )}
    </div>
  );
}

function SyncResult({ data }) {
  return (
    <div className="sync-result">
      <div>
        <strong>Cliente</strong>
        <span>{data?.client ?? "Cliente selecionado"}</span>
      </div>
      <div>
        <strong>Lista ClickUp</strong>
        <span>{data?.listId ?? "Aguardando configuração"}</span>
      </div>
      <div>
        <strong>Status encontrados</strong>
        <span>{data?.statuses?.length ? data.statuses.join(", ") : "Sem status retornado"}</span>
      </div>
    </div>
  );
}

function MetricAccessPreview({ data }) {
  const modules = ["Resumo de métricas", "Histórico mensal", "Comparativo", "Leitura estratégica"];

  return (
    <div className="metric-access-preview">
      <div className="plan-numbers">
        <div><strong>{formatMetric(data?.followers)}</strong><span>seguidores</span></div>
        <div><strong>{formatMetric(data?.reach)}</strong><span>alcance</span></div>
        <div><strong>{formatMetric(data?.interactions)}</strong><span>interações</span></div>
      </div>
      <div className="access-pills">
        {modules.map((module) => <span key={module}>{module}</span>)}
      </div>
    </div>
  );
}

function ClientAdminPreview({ client }) {
  const accessItems = [
    ["Portal do cliente", client?.status === "Ativo" ? "Liberado" : "Bloqueado"],
    ["Métricas", client?.metricsCount ? `${client.metricsCount} mês(es)` : "Sem dados"],
    ["Planejamento", "Configurável"],
    ["Tráfego pago", "Configurável"]
  ];

  return (
    <div className="client-admin-preview">
      <div className="plan-numbers">
        <div><strong>{client?.status ?? "Pendente"}</strong><span>status</span></div>
        <div><strong>{client?.lastMetricMonth ?? "Sem dados"}</strong><span>métricas</span></div>
        <div><strong>{client?.owner ?? "Equipe Look"}</strong><span>responsável</span></div>
      </div>
      <div className="client-permission-list">
        {accessItems.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

function PlanSummary() {
  return (
    <div className="plan-summary">
      <article>
        <span>POST</span>
        <strong>Planejamento de agosto</strong>
        <small>Material pronto para revisão</small>
      </article>
      <div className="plan-numbers">
        <div><strong>12</strong><span>conteúdos</span></div>
        <div><strong>3</strong><span>ações</span></div>
        <div><strong>4</strong><span>reuniões</span></div>
      </div>
    </div>
  );
}

function ActionChoices() {
  return (
    <div className="modal-actions-grid">
      <button><Eye size={16} /> Visualizar</button>
      <button><Edit3 size={16} /> Solicitar ajuste</button>
      <button><Check size={16} /> Aprovar</button>
    </div>
  );
}

function SideMenu({ active, setActive, onClose, client }) {
  const items = [
    ["inicio", "Início", Home],
    ["acoes", "Ações", Layers3],
    ["planejamento", "Planejamento", ClipboardList],
    ["trafego", "Tráfego", BarChart3],
    ["aprovacoes", "Aprovações", Check],
    ["arquivos", "Arquivos", FolderOpen]
  ];

  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-top">
          <Logo />
          <button onClick={onClose} className="drawer-close" aria-label="Fechar menu">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="profile-card">
          <span>Perfil do cliente</span>
          <strong>{client?.client ?? "Cliente Look"}</strong>
        </div>
        <nav>
          {items.map(([key, label, Icon]) => (
            <button
              key={key}
              className={active === key ? "active" : ""}
              onClick={() => {
                setActive(key);
                onClose();
              }}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function LoginGate({ onEnter, onLogin, authError, authLoading }) {
  const [email, setEmail] = useState("cecilio@lookassessoria.com");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!email.trim() || !password) {
      setLocalError("Informe e-mail e senha para entrar.");
      return;
    }

    try {
      await onLogin({ email: email.trim(), password });
    } catch (error) {
      setLocalError(error.message);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card">
        <Logo />
        <p className="eyebrow">Portal Look</p>
        <h1>Acompanhe conteúdo, tráfego e ações em um único painel.</h1>
        <p>Escolha uma área para visualizar o protótipo funcional.</p>
        {isSupabaseConfigured && (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>E-mail</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
            </label>
            <label>
              <span>Senha</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Senha criada no Supabase" />
            </label>
            {(localError || authError) && <strong className="login-error">{localError || authError}</strong>}
            <button disabled={authLoading} type="submit">
              <Lock size={17} /> {authLoading ? "Entrando..." : "Entrar no portal"}
            </button>
          </form>
        )}
        {!isSupabaseConfigured && (
        <div className="login-actions">
          <button onClick={() => onEnter("client")}><Lock size={17} /> Entrar como cliente</button>
          <button onClick={() => onEnter("admin")}><ShieldCheck size={17} /> Entrar como ADM</button>
        </div>
        )}
      </section>
    </main>
  );
}

function App() {
  const [area, setArea] = useState(null);
  const [clientView, setClientView] = useState("inicio");
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(false);
  const [planningByClient, setPlanningByClient] = useState({});
  const [trafficReportsByClient, setTrafficReportsByClient] = useState(() => ({
    [slugFromClient(defaultTrafficReport.client)]: defaultTrafficReport
  }));
  const [selectedTrafficClientId, setSelectedTrafficClientId] = useState(slugFromClient(defaultTrafficReport.client));
  const [clientDirectory, setClientDirectory] = useState(() => buildClientDirectory());
  const [session, setSession] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState("cecilio");
  const [syncStatesByClient, setSyncStatesByClient] = useState({});
  const [selectedSyncClientId, setSelectedSyncClientId] = useState(slugFromClient(defaultTrafficReport.client));
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");

  const openModal = (type, data = null) => setModal({ type, data });
  const selectedTrafficClient = clientDirectory.find((client) => client.id === selectedTrafficClientId) ?? clientDirectory[0];
  const trafficReport = selectedTrafficClient
    ? trafficReportsByClient[selectedTrafficClient.id] ?? buildTrafficReportForClient(selectedTrafficClient.client)
    : buildTrafficReportForClient("Cliente selecionado");
  const fallbackClient = clientDirectory.find((client) => client.id === slugFromClient("Lucas Fraga")) ?? clientDirectory[0];
  const portalClient = currentClient ?? fallbackClient;
  const portalClientId = portalClient?.id ?? slugFromClient("Lucas Fraga");
  const clientTrafficReport = trafficReportsByClient[portalClientId] ?? buildTrafficReportForClient(portalClient?.client ?? "Cliente Look");
  const syncVisibleClients = filterClientsForAdmin(clientDirectory, currentAdminId).filter((client) => client.status === "Ativo");
  const selectedSyncClient = syncVisibleClients.find((client) => client.id === selectedSyncClientId) ?? syncVisibleClients[0] ?? clientDirectory[0];
  const activeSyncClientId = selectedSyncClient?.id ?? selectedSyncClientId;
  const adminSyncState = syncStatesByClient[activeSyncClientId] ?? defaultSyncState;
  const clientPlanning = planningByClient[portalClientId] ?? {};
  const clientSyncState = syncStatesByClient[portalClientId] ?? defaultSyncState;
  const applySupabaseUser = async (user) => {
    if (!supabase || !user) return;

    setAuthLoading(true);
    setAuthError("");

    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    const profile = data ?? {
      email: user.email,
      full_name: user.email,
      role: "client"
    };
    const account = getAdminAccountByEmail(profile.email);
    let linkedClient = null;

    if (!isAdminProfile(profile)) {
      const { data: accessRows, error: accessError } = await supabase
        .from("user_client_access")
        .select("client_id, access_level")
        .eq("user_id", user.id)
        .limit(1);

      if (accessError) {
        setAuthError(accessError.message);
        setAuthLoading(false);
        return;
      }

      const firstAccess = accessRows?.[0];
      if (!firstAccess) {
        setAuthError("Este login ainda não está vinculado a um cliente no Supabase.");
        setAuthLoading(false);
        return;
      }

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id,name,status,social_media_group")
        .eq("id", firstAccess.client_id)
        .maybeSingle();

      if (clientError || !clientData) {
        setAuthError(clientError?.message ?? "Cliente vinculado não encontrado no Supabase.");
        setAuthLoading(false);
        return;
      }

      const directoryClient = clientDirectory.find((client) => normalizeClientName(client.client) === normalizeClientName(clientData.name));
      linkedClient = {
        ...(directoryClient ?? {
          lastMetricMonth: "Sem dados",
          metricsCount: 0,
          followers: null,
          source: "Supabase",
          owner: clientData.social_media_group ?? "Equipe Look",
          ownerId: "cecilio",
          metricClient: resolveMetricClientName(clientData.name)
        }),
        id: slugFromClient(clientData.name),
        supabaseId: clientData.id,
        client: clientData.name,
        status: statusFromSupabase(clientData.status),
        access: statusFromSupabase(clientData.status) === "Ativo" ? "Liberado" : "Bloqueado"
      };
    }

    setCurrentProfile(profile);
    setCurrentClient(linkedClient);
    setCurrentAdminId(profile.role === "admin_master" ? "cecilio" : account.id);
    setArea(isAdminProfile(profile) ? "admin" : "client");
    setAuthLoading(false);
  };

  const handleLogin = async ({ email, password }) => {
    if (!supabase) {
      throw new Error("Supabase ainda nao foi configurado.");
    }

    setAuthLoading(true);
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      throw error;
    }

    setSession(data.session);
    await applySupabaseUser(data.user);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setCurrentProfile(null);
    setCurrentClient(null);
    setCurrentAdminId("cecilio");
    setArea(null);
  };

  const handleAdminChange = (adminId) => {
    if (!currentProfile || currentProfile.role === "admin_master") {
      setCurrentAdminId(adminId);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      setSession(data.session);
      if (data.session?.user) {
        await applySupabaseUser(data.session.user);
        return;
      }

      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) {
        void applySupabaseUser(nextSession.user);
        return;
      }

      setCurrentProfile(null);
      setCurrentClient(null);
      setArea(null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleClientStatusChange = (clientId, status) => {
    setClientDirectory((current) => current.map((client) => (
      client.id === clientId
        ? { ...client, status, access: status === "Ativo" ? "Liberado" : "Bloqueado" }
        : client
    )));
  };
  const handleCreateClient = (ownerId = "cecilio") => {
    const owner = lookAdminAccounts.find((account) => account.id === ownerId);
    const nextNumber = clientDirectory.filter((client) => client.client.startsWith("NOVO CLIENTE")).length + 1;
    const newClient = {
      id: `novo-cliente-${Date.now()}`,
      client: `NOVO CLIENTE ${nextNumber}`,
      status: "Em entrada",
      access: "Bloqueado",
      lastMetricMonth: "Sem dados",
      metricsCount: 0,
      followers: null,
      source: "Cadastro manual",
      owner: owner && owner.id !== "cecilio" ? `${owner.name} - ${owner.role}` : "Equipe Look",
      ownerId,
      metricClient: null
    };
    setClientDirectory((current) => [newClient, ...current]);
    openModal("clientCreated", newClient);
  };
  const handleTrafficUpload = (file, client) => {
    const clientId = client?.id ?? selectedTrafficClient?.id ?? selectedTrafficClientId;
    const clientName = client?.client ?? selectedTrafficClient?.client ?? "Cliente selecionado";
    setSelectedTrafficClientId(clientId);
    setTrafficReportsByClient((currentReports) => ({
      ...currentReports,
      [clientId]: {
      ...(currentReports[clientId] ?? buildTrafficReportForClient(clientName)),
      client: clientName,
      source: "PDF importado no ADM",
      status: "PDF processado",
      updatedAt: "Publicado agora",
      uploadedFile: file.name,
      summary: "O PDF enviado foi transformado em uma visualização executiva para o cliente acompanhar investimento, geração de leads, custo médio e prioridades da próxima otimização.",
      metrics: [
        { label: "Investimento", value: "R$ 4.850", hint: "dado extraído do PDF", tone: "dark" },
        { label: "Leads gerados", value: "268", hint: "volume consolidado", tone: "green" },
        { label: "CPL médio", value: "R$ 18,09", hint: "custo controlado", tone: "blue" },
        { label: "Conversas qualificadas", value: "74", hint: "oportunidades comerciais", tone: "mint" }
      ]
      }
    }));
    openModal("trafficUploaded", { file: file.name, client: clientName });
  };

  const handleSyncClickUp = async (client) => {
    const clientToSync = client ?? selectedSyncClient;
    if (!clientToSync) {
      openModal("syncError", { message: "Selecione um cliente ativo antes de sincronizar." });
      return;
    }

    const clientId = clientToSync.id;
    const clientName = clientToSync.client;
    setSelectedSyncClientId(clientId);
    setSyncStatesByClient((current) => ({
      ...current,
      [clientId]: { ...(current[clientId] ?? defaultSyncState), syncing: true }
    }));
    try {
      const isLocalhost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
      const endpoint = isLocalhost
        ? `http://127.0.0.1:8787/api/clickup?clientId=${encodeURIComponent(clientId)}`
        : `/api/clickup?clientId=${encodeURIComponent(clientId)}`;
      const headers = {};

      if (isSupabaseConfigured) {
        if (!session?.access_token) {
          throw new Error("Entre no portal antes de sincronizar o ClickUp.");
        }
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(endpoint, { headers });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível sincronizar com o ClickUp.");
      }

      setPlanningByClient((current) => ({
        ...current,
        [clientId]: {
          posts: payload.posts ?? [],
          fullPosts: payload.allPosts ?? payload.posts ?? [],
          actions: payload.actions ?? []
        }
      }));
      setSyncStatesByClient((current) => ({
        ...current,
        [clientId]: {
          synced: true,
          imported: payload.imported ?? 0,
          upcoming: payload.upcomingCount ?? payload.posts?.length ?? 0,
          lastSync: payload.syncedAt ?? "Agora",
          syncing: false,
          source: `ClickUp real - ${clientName}`,
          listId: payload.listId,
          client: payload.client ?? clientName
        }
      }));
      openModal("syncComplete", {
        imported: payload.imported ?? 0,
        upcoming: payload.upcomingCount ?? payload.posts?.length ?? 0,
        statuses: payload.rawStatuses ?? [],
        listId: payload.listId,
        client: payload.client ?? clientName
      });
    } catch (error) {
      setSyncStatesByClient((current) => ({
        ...current,
        [clientId]: { ...(current[clientId] ?? defaultSyncState), syncing: false }
      }));
      openModal("syncError", { message: error.message });
    }
  };
  const fallbackPosts = buildFallbackPostsForClient(portalClient);
  const fallbackActions = buildFallbackActionsForClient(portalClient);
  const portalPosts = clientSyncState.synced ? clientPlanning.posts ?? [] : fallbackPosts;
  const fullPlanningPosts = clientSyncState.synced ? clientPlanning.fullPosts ?? [] : fallbackPosts;
  const portalActions = clientSyncState.synced ? [...(clientPlanning.actions ?? []), ...fallbackActions] : fallbackActions;
  const label = useMemo(() => area === "admin" ? "Ver área do cliente" : "Ver painel ADM", [area]);

  const switchLabel = isSupabaseConfigured ? "Sair" : label;

  if (!area) {
    return <LoginGate onEnter={setArea} onLogin={handleLogin} authError={authError} authLoading={authLoading} />;
  }

  return (
    <div className="app">
      <button className="area-switch" onClick={isSupabaseConfigured ? handleSignOut : () => setArea(area === "admin" ? "client" : "admin")}>
        {switchLabel}
      </button>
      {area === "admin" ? (
        <AdminPanel
          openModal={openModal}
          syncState={adminSyncState}
          onSync={handleSyncClickUp}
          trafficReport={trafficReport}
          onTrafficUpload={handleTrafficUpload}
          clientDirectory={clientDirectory}
          onClientStatusChange={handleClientStatusChange}
          onCreateClient={handleCreateClient}
          currentProfile={currentProfile}
          currentAdminId={currentAdminId}
          onAdminChange={handleAdminChange}
          onSignOut={handleSignOut}
          selectedTrafficClientId={selectedTrafficClientId}
          onTrafficClientChange={setSelectedTrafficClientId}
          selectedSyncClientId={activeSyncClientId}
          onSyncClientChange={setSelectedSyncClientId}
        />
      ) : (
        <ClientArea
          active={clientView}
          setActive={setClientView}
          openModal={openModal}
          openMenu={() => setMenu(true)}
          posts={portalPosts}
          fullPosts={fullPlanningPosts}
          actions={portalActions}
          syncState={clientSyncState}
          trafficReport={clientTrafficReport}
          client={portalClient}
        />
      )}
      {modal && <Modal type={modal.type} data={modal.data} onClose={() => setModal(null)} />}
      {menu && <SideMenu active={clientView} setActive={setClientView} onClose={() => setMenu(false)} client={portalClient} />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
