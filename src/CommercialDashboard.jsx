import React, { useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, Upload } from "lucide-react";
import { supabase } from "./supabaseClient";

const HEIGHT_MESSAGE_SOURCE = "look-commercial-dashboard";

function buildDashboardSrcDoc(html) {
  const heightScript = `
<script>
(function () {
  function postHeight() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ source: "${HEIGHT_MESSAGE_SOURCE}", height: h }, "*");
  }
  window.addEventListener("load", postHeight);
  window.addEventListener("resize", postHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(postHeight).observe(document.body);
  }
  setTimeout(postHeight, 300);
  setTimeout(postHeight, 1000);
})();
<\/script>`;

  return `${html}\n${heightScript}`;
}

function DashboardFrame({ html, title }) {
  const [height, setHeight] = useState(420);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.source === HEIGHT_MESSAGE_SOURCE) {
        setHeight(Math.min(Math.max(Math.round(event.data.height), 320), 8000));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      className="commercial-dashboard-frame"
      title={title}
      srcDoc={buildDashboardSrcDoc(html)}
      sandbox="allow-scripts allow-popups"
      style={{ height: `${height}px` }}
    />
  );
}

export function CommercialDashboardClient({ client, dashboard }) {
  if (!dashboard?.html) {
    return (
      <section className="white-panel detail-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Dashboard comercial</p>
            <h3>Ainda não publicado</h3>
          </div>
        </div>
        <p className="muted">Assim que a equipe Look publicar o dashboard comercial de {client?.client ?? "sua conta"}, ele aparece aqui.</p>
      </section>
    );
  }

  return (
    <section className="white-panel detail-panel commercial-dashboard-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Dashboard comercial</p>
          <h3>{client?.client ?? "Seu dashboard"}</h3>
          <span className="muted">{dashboard.updatedAtLabel}</span>
        </div>
      </div>
      <DashboardFrame html={dashboard.html} title={`Dashboard comercial - ${client?.client ?? ""}`} />
    </section>
  );
}

export function CommercialDashboardAdmin({ clients, dashboardsByClient, onSave }) {
  const activeClients = clients.filter((client) => client.status === "Ativo");
  const [selectedClientId, setSelectedClientId] = useState(activeClients[0]?.id ?? "");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const fileInputRef = useRef(null);

  const selectedClient = activeClients.find((client) => client.id === selectedClientId) ?? activeClients[0];
  const existingDashboard = selectedClient ? dashboardsByClient[selectedClient.id] : null;

  useEffect(() => {
    setHtmlDraft(existingDashboard?.html ?? "");
    setStatus({ state: "idle", message: "" });
  }, [selectedClient?.id]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHtmlDraft(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!selectedClient || !htmlDraft.trim()) {
      setStatus({ state: "error", message: "Selecione um cliente e cole/suba um HTML antes de publicar." });
      return;
    }

    setStatus({ state: "saving", message: "Publicando..." });

    try {
      await onSave(selectedClient, htmlDraft);
      setStatus({ state: "success", message: "Dashboard publicado para o cliente." });
    } catch (error) {
      setStatus({ state: "error", message: error.message ?? "Não foi possível publicar o dashboard." });
    }
  };

  return (
    <div className="commercial-dashboard-admin">
      <section className="traffic-client-picker">
        <div>
          <p className="eyebrow">Cliente do dashboard</p>
          <h3>{selectedClient?.client ?? "Nenhum cliente ativo"}</h3>
          <span>{existingDashboard ? `Publicado ${existingDashboard.updatedAtLabel}` : "Nenhum dashboard publicado ainda"}</span>
        </div>
        <label>
          <span>Escolher cliente</span>
          <select value={selectedClient?.id ?? ""} onChange={(event) => setSelectedClientId(event.target.value)} disabled={!activeClients.length}>
            {activeClients.length ? activeClients.map((client) => (
              <option key={client.id} value={client.id}>{client.client}</option>
            )) : <option>Nenhum cliente ativo</option>}
          </select>
        </label>
      </section>

      <div className="commercial-dashboard-editor">
        <div className="commercial-dashboard-editor-head">
          <p className="eyebrow">Código HTML do dashboard</p>
          <button type="button" className="secondary-admin" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> Subir arquivo .html
          </button>
          <input ref={fileInputRef} type="file" accept=".html,text/html" onChange={handleFile} hidden />
        </div>
        <textarea
          className="commercial-dashboard-textarea"
          placeholder="Cole aqui o HTML completo do dashboard comercial deste cliente..."
          value={htmlDraft}
          onChange={(event) => setHtmlDraft(event.target.value)}
          spellCheck={false}
        />
        <div className="commercial-dashboard-actions">
          <button type="button" className="primary-wide" onClick={handleSave} disabled={status.state === "saving"}>
            {status.state === "saving" ? <RefreshCw size={16} className="spin" /> : <FileText size={16} />}
            {status.state === "saving" ? "Publicando..." : "Publicar para o cliente"}
          </button>
          {status.message && <span className={`commercial-dashboard-status ${status.state}`}>{status.message}</span>}
        </div>
      </div>

      {htmlDraft.trim() && (
        <div className="commercial-dashboard-preview">
          <p className="eyebrow">Prévia — como o cliente vai ver</p>
          <DashboardFrame html={htmlDraft} title="Prévia do dashboard comercial" />
        </div>
      )}
    </div>
  );
}

export async function resolveSupabaseClientId(clientName) {
  if (!supabase) return null;
  const { data } = await supabase.from("clients").select("id").eq("name", clientName).maybeSingle();
  return data?.id ?? null;
}

export async function fetchCommercialDashboard(clientSupabaseId) {
  if (!supabase || !clientSupabaseId) return null;
  const { data, error } = await supabase
    .from("commercial_dashboards")
    .select("html, filename, updated_at")
    .eq("client_id", clientSupabaseId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    html: data.html,
    filename: data.filename,
    updatedAtLabel: `atualizado em ${new Date(data.updated_at).toLocaleDateString("pt-BR")}`
  };
}

export async function saveCommercialDashboard(clientSupabaseId, html) {
  if (!supabase || !clientSupabaseId) throw new Error("Cliente ainda não está cadastrado no Supabase.");

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("commercial_dashboards")
    .upsert(
      {
        client_id: clientSupabaseId,
        html,
        updated_at: new Date().toISOString(),
        updated_by: userData?.user?.id ?? null
      },
      { onConflict: "client_id" }
    );

  if (error) throw new Error(error.message);
}
