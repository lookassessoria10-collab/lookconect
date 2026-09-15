import React, { useEffect, useMemo, useState } from "react";
import { Workflow } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { resolveSupabaseClientId } from "./CommercialDashboard";
import { ACTION_MAP_CATEGORIES } from "./actionMapCategories";
import ActionMapCanvas from "./ActionMapCanvas";

function emptyItemsByCategory() {
  return Object.fromEntries(ACTION_MAP_CATEGORIES.map((category) => [category.key, []]));
}

export async function fetchActionMap(clientSupabaseId) {
  const itemsByCategory = emptyItemsByCategory();
  if (!supabase || !clientSupabaseId) return { title: "", subtitle: "", layout: null, itemsByCategory };

  const [{ data: meta }, { data: items }] = await Promise.all([
    supabase.from("action_maps").select("title, subtitle, layout").eq("client_id", clientSupabaseId).maybeSingle(),
    supabase.from("action_map_items").select("id, category, title, position, position_x, position_y").eq("client_id", clientSupabaseId).order("position", { ascending: true })
  ]);

  (items ?? []).forEach((item) => {
    if (itemsByCategory[item.category]) {
      itemsByCategory[item.category].push({
        id: item.id,
        title: item.title,
        x: item.position_x,
        y: item.position_y
      });
    }
  });

  return { title: meta?.title ?? "", subtitle: meta?.subtitle ?? "", layout: meta?.layout ?? null, itemsByCategory };
}

async function saveActionMapMeta(clientSupabaseId, { title, subtitle }) {
  if (!supabase || !clientSupabaseId) return;
  await supabase.from("action_maps").upsert(
    { client_id: clientSupabaseId, title, subtitle, updated_at: new Date().toISOString() },
    { onConflict: "client_id" }
  );
}

async function saveActionMapLayout(clientSupabaseId, layout) {
  if (!supabase || !clientSupabaseId) return;
  await supabase.from("action_maps").upsert(
    { client_id: clientSupabaseId, layout, updated_at: new Date().toISOString() },
    { onConflict: "client_id" }
  );
}

async function addActionMapItem(clientSupabaseId, category, title, position, x, y) {
  if (!supabase || !clientSupabaseId) return { id: `local-${Date.now()}`, title, x, y };
  const { data, error } = await supabase
    .from("action_map_items")
    .insert({ client_id: clientSupabaseId, category, title, position, position_x: x, position_y: y })
    .select("id, title, position_x, position_y")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, title: data.title, x: data.position_x, y: data.position_y };
}

async function renameActionMapItem(itemId, title) {
  if (!supabase || String(itemId).startsWith("local-")) return;
  await supabase.from("action_map_items").update({ title }).eq("id", itemId);
}

async function moveActionMapItem(itemId, x, y) {
  if (!supabase || String(itemId).startsWith("local-")) return;
  await supabase.from("action_map_items").update({ position_x: x, position_y: y }).eq("id", itemId);
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
  const [categoryLayout, setCategoryLayout] = useState(null);
  const [autoEditId, setAutoEditId] = useState(null);
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
      setCategoryLayout(map.layout);
      setAutoEditId(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClient?.id]);

  const handleAddItem = async (categoryKey, position) => {
    if (!selectedClient) return;
    const order = itemsByCategory[categoryKey]?.length ?? 0;
    const newItem = await addActionMapItem(supabaseClientId, categoryKey, "", order, position.x, position.y);
    setItemsByCategory((current) => ({ ...current, [categoryKey]: [...current[categoryKey], newItem] }));
    setAutoEditId(newItem.id);
  };

  const handleRenameItem = (categoryKey, itemId, title) => {
    renameActionMapItem(itemId, title);
    setItemsByCategory((current) => ({
      ...current,
      [categoryKey]: current[categoryKey].map((item) => (item.id === itemId ? { ...item, title } : item))
    }));
    setAutoEditId((current) => (current === itemId ? null : current));
  };

  const handleDeleteItem = (categoryKey, itemId) => {
    removeActionMapItem(itemId);
    setItemsByCategory((current) => ({ ...current, [categoryKey]: current[categoryKey].filter((item) => item.id !== itemId) }));
    setAutoEditId((current) => (current === itemId ? null : current));
  };

  const handleMoveItem = (itemId, x, y) => {
    moveActionMapItem(itemId, x, y);
    setItemsByCategory((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((item) => (item.id === itemId ? { ...item, x, y } : item));
      }
      return next;
    });
  };

  const handleMoveCategory = (categoryKey, x, y) => {
    setCategoryLayout((current) => {
      const next = { ...(current ?? {}), [categoryKey]: { x, y } };
      saveActionMapLayout(supabaseClientId, next);
      return next;
    });
  };

  const handleMetaBlur = () => {
    if (selectedClient) saveActionMapMeta(supabaseClientId, { title, subtitle });
  };

  return (
    <div className="action-map-admin">
      <section className="traffic-client-picker">
        <div>
          <p className="eyebrow">Cliente do mapa</p>
          <h3>{selectedClient?.client ?? "Nenhum cliente ativo"}</h3>
          <span>{loading ? "Carregando..." : "Arraste os nós para reorganizar. Clique em \"Novo item\" ou dê duplo clique em um item para editar."}</span>
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

      <ActionMapCanvas
        key={selectedClient?.id}
        hubTitle={selectedClient?.client?.split(" ")[0] ?? "Cliente"}
        hubSubtitle={subtitle || "Mapa de ações"}
        itemsByCategory={itemsByCategory}
        categoryLayout={categoryLayout}
        autoEditId={autoEditId}
        onAddItem={handleAddItem}
        onRenameItem={handleRenameItem}
        onDeleteItem={handleDeleteItem}
        onMoveItem={handleMoveItem}
        onMoveCategory={handleMoveCategory}
      />
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
