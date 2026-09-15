import React, { useEffect, useMemo, useState } from "react";
import { Plus, Workflow, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { resolveSupabaseClientId } from "./CommercialDashboard";
import { ACTION_MAP_CATEGORIES } from "./actionMapCategories";
import RadialActionCanvas from "./RadialActionCanvas";

function emptyItemsByCategory() {
  return Object.fromEntries(ACTION_MAP_CATEGORIES.map((category) => [category.key, []]));
}

export async function fetchActionMap(clientSupabaseId) {
  const itemsByCategory = emptyItemsByCategory();
  if (!supabase || !clientSupabaseId) return { title: "", subtitle: "", itemsByCategory };

  const [{ data: meta }, { data: items }] = await Promise.all([
    supabase.from("action_maps").select("title, subtitle").eq("client_id", clientSupabaseId).maybeSingle(),
    supabase.from("action_map_items").select("id, category, title, position").eq("client_id", clientSupabaseId).order("position", { ascending: true })
  ]);

  (items ?? []).forEach((item) => {
    if (itemsByCategory[item.category]) itemsByCategory[item.category].push(item);
  });

  return { title: meta?.title ?? "", subtitle: meta?.subtitle ?? "", itemsByCategory };
}

async function saveActionMapMeta(clientSupabaseId, { title, subtitle }) {
  if (!supabase || !clientSupabaseId) return;
  await supabase.from("action_maps").upsert(
    { client_id: clientSupabaseId, title, subtitle, updated_at: new Date().toISOString() },
    { onConflict: "client_id" }
  );
}

async function addActionMapItem(clientSupabaseId, category, title, position) {
  if (!supabase || !clientSupabaseId) return { id: `local-${Date.now()}`, category, title, position };
  const { data, error } = await supabase
    .from("action_map_items")
    .insert({ client_id: clientSupabaseId, category, title, position })
    .select("id, category, title, position")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function removeActionMapItem(itemId) {
  if (!supabase || String(itemId).startsWith("local-")) return;
  await supabase.from("action_map_items").delete().eq("id", itemId);
}

export function ActionMapEditor({ clients }) {
  const activeClients = clients.filter((client) => client.status === "Ativo");
  const [selectedClientId, setSelectedClientId] = useState(activeClients[0]?.id ?? "");
  const [supabaseClientId, setSupabaseClientId] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [itemsByCategory, setItemsByCategory] = useState(emptyItemsByCategory);
  const [openCategory, setOpenCategory] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClient = activeClients.find((client) => client.id === selectedClientId) ?? activeClients[0];

  useEffect(() => {
    let cancelled = false;
    if (!selectedClient) return undefined;

    setLoading(true);
    (async () => {
      const resolvedId = isSupabaseConfigured ? await resolveSupabaseClientId(selectedClient.client) : null;
      if (cancelled) return;
      setSupabaseClientId(resolvedId);
      const map = await fetchActionMap(resolvedId);
      if (cancelled) return;
      setTitle(map.title || `Ações para ${selectedClient.client}`);
      setSubtitle(map.subtitle);
      setItemsByCategory(map.itemsByCategory);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClient?.id]);

  const handleAddItem = async (categoryKey) => {
    const text = draftText.trim();
    if (!text || !selectedClient) return;

    const position = itemsByCategory[categoryKey]?.length ?? 0;
    const newItem = await addActionMapItem(supabaseClientId, categoryKey, text, position);
    setItemsByCategory((current) => ({ ...current, [categoryKey]: [...current[categoryKey], newItem] }));
    setDraftText("");
  };

  const handleRemoveItem = async (categoryKey, itemId) => {
    await removeActionMapItem(itemId);
    setItemsByCategory((current) => ({ ...current, [categoryKey]: current[categoryKey].filter((item) => item.id !== itemId) }));
  };

  const handleMetaBlur = () => {
    if (selectedClient) saveActionMapMeta(supabaseClientId, { title, subtitle });
  };

  const canvasCategories = ACTION_MAP_CATEGORIES.map((category) => ({
    ...category,
    count: itemsByCategory[category.key]?.length ?? 0,
    onOpen: () => setOpenCategory(category.key)
  }));

  const activeCategory = ACTION_MAP_CATEGORIES.find((category) => category.key === openCategory);
  const activeItems = activeCategory ? itemsByCategory[activeCategory.key] ?? [] : [];

  return (
    <div className="action-map-admin">
      <section className="traffic-client-picker">
        <div>
          <p className="eyebrow">Cliente do mapa</p>
          <h3>{selectedClient?.client ?? "Nenhum cliente ativo"}</h3>
          <span>{loading ? "Carregando..." : "Clique em uma categoria no mapa para adicionar ou remover itens."}</span>
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

      <section className="action-map-meta">
        <label>
          <span>Título do mapa</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={handleMetaBlur} placeholder="Ex.: Ações para o Dr. Lucas Fraga" />
        </label>
        <label>
          <span>Objetivo (subtítulo)</span>
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} onBlur={handleMetaBlur} placeholder="Ex.: Aumentar percepção de autoridade" />
        </label>
      </section>

      <RadialActionCanvas hubTitle={selectedClient?.client?.split(" ")[0] ?? "Cliente"} hubSubtitle={subtitle || "Mapa de ações"} categories={canvasCategories} />

      {activeCategory && (
        <div className="actions-map-backdrop" onClick={() => setOpenCategory(null)}>
          <aside className="actions-map-panel" onClick={(event) => event.stopPropagation()}>
            <div className="actions-map-panel-head">
              <div>
                <span className="actions-map-dot" style={{ background: activeCategory.color }} />
                <strong>{activeCategory.label}</strong>
              </div>
              <button onClick={() => setOpenCategory(null)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div className="actions-map-panel-list editable">
              {activeItems.length ? activeItems.map((item) => (
                <div key={item.id}>
                  <strong>{item.title}</strong>
                  <button type="button" className="actions-map-item-remove" onClick={() => handleRemoveItem(activeCategory.key, item.id)} aria-label={`Remover ${item.title}`}>
                    <X size={14} />
                  </button>
                </div>
              )) : (
                <div className="actions-map-empty">Nenhum item nesta dimensão ainda.</div>
              )}
            </div>
            <form
              className="actions-map-add-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddItem(activeCategory.key);
              }}
            >
              <input value={draftText} onChange={(event) => setDraftText(event.target.value)} placeholder="Adicionar item..." />
              <button type="submit"><Plus size={15} /> Adicionar</button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

export function ActionMapOverview({ clients }) {
  const activeClients = clients.filter((client) => client.status === "Ativo");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const results = await Promise.all(activeClients.map(async (client) => {
        const resolvedId = isSupabaseConfigured ? await resolveSupabaseClientId(client.client) : null;
        const map = await fetchActionMap(resolvedId);
        const totalItems = Object.values(map.itemsByCategory).reduce((sum, list) => sum + list.length, 0);
        const blockingItems = map.itemsByCategory.riscos ?? [];
        return { client, map, totalItems, blockingCount: blockingItems.length };
      }));
      if (!cancelled) {
        setRows(results);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clients]);

  const totals = useMemo(() => ({
    clientsWithMap: rows.filter((row) => row.totalItems > 0).length,
    totalActions: rows.reduce((sum, row) => sum + row.totalItems, 0),
    totalBlocking: rows.reduce((sum, row) => sum + row.blockingCount, 0)
  }), [rows]);

  return (
    <div className="action-map-overview">
      <section className="admin-kpis">
        <button type="button"><Workflow size={18} /><strong>{rows.length}</strong><span>clientes acompanhados</span></button>
        <button type="button"><Workflow size={18} /><strong>{totals.clientsWithMap}</strong><span>mapas com ações</span></button>
        <button type="button"><Workflow size={18} /><strong>{totals.totalActions}</strong><span>itens no total</span></button>
        <button type="button"><Workflow size={18} /><strong>{totals.totalBlocking}</strong><span>riscos/pendências</span></button>
      </section>

      <section className="action-map-overview-list">
        {loading && <p className="muted">Carregando andamento dos mapas...</p>}
        {!loading && rows.map(({ client, map, totalItems, blockingCount }) => (
          <article key={client.id} className={expandedId === client.id ? "expanded" : ""}>
            <button type="button" className="action-map-overview-head" onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}>
              <div>
                <strong>{client.client}</strong>
                <span>{map.subtitle || "Sem objetivo definido ainda"}</span>
              </div>
              <div className="action-map-overview-counts">
                <b>{totalItems} itens</b>
                {blockingCount > 0 && <em>{blockingCount} risco{blockingCount === 1 ? "" : "s"}</em>}
              </div>
            </button>
            {expandedId === client.id && (
              <div className="action-map-overview-detail">
                {ACTION_MAP_CATEGORIES.map((category) => {
                  const items = map.itemsByCategory[category.key] ?? [];
                  if (!items.length) return null;
                  return (
                    <div key={category.key}>
                      <span className="actions-map-dot" style={{ background: category.color }} />
                      <strong>{category.label}</strong>
                      <ul>
                        {items.map((item) => <li key={item.id}>{item.title}</li>)}
                      </ul>
                    </div>
                  );
                })}
                {totalItems === 0 && <p className="muted">Nenhuma ação cadastrada para este cliente ainda.</p>}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
