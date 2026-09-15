import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import RadialActionCanvas from "./RadialActionCanvas";

const FALLBACK_COLORS = {
  estrategia: "#3457d5",
  conteudo: "#1fae74",
  aprovacoes: "#d1892f",
  trafego: "#0f7c8f"
};

function buildFallbackCategories(actions, fullPosts, trafficReport) {
  const pendingPosts = fullPosts.filter((post) => post.status !== "Publicado" && post.status !== "Aprovado");
  const campaigns = trafficReport?.campaigns ?? [];

  return [
    {
      key: "estrategia",
      label: "Ações estratégicas",
      color: FALLBACK_COLORS.estrategia,
      items: actions.map((action) => ({ title: action.label, meta: `${action.value}% concluído` }))
    },
    {
      key: "conteudo",
      label: "Conteúdo",
      color: FALLBACK_COLORS.conteudo,
      items: fullPosts.map((post) => ({ title: post.title, meta: [post.weekday, post.date, post.status].filter(Boolean).join(" · ") }))
    },
    {
      key: "aprovacoes",
      label: "Aprovações",
      color: FALLBACK_COLORS.aprovacoes,
      items: pendingPosts.map((post) => ({ title: post.title, meta: post.status }))
    },
    {
      key: "trafego",
      label: "Tráfego pago",
      color: FALLBACK_COLORS.trafego,
      items: campaigns.map((campaign) => ({ title: campaign.name, meta: `${campaign.result} · ${campaign.status}` }))
    }
  ];
}

export default function ActionsMap({ client, actions = [], fullPosts = [], trafficReport, mapOverride }) {
  const [openCategory, setOpenCategory] = useState(null);

  const hasRealMap = Boolean(mapOverride?.categories?.some((category) => category.items.length));

  const categories = useMemo(() => {
    if (hasRealMap) return mapOverride.categories;
    return buildFallbackCategories(actions, fullPosts, trafficReport);
  }, [hasRealMap, mapOverride, actions, fullPosts, trafficReport]);

  const visibleCategories = categories.filter((category) => category.items.length > 0);
  const canvasCategories = visibleCategories.map((category) => ({
    ...category,
    count: category.items.length,
    onOpen: () => setOpenCategory(category.key)
  }));

  const hubTitle = client?.client ? client.client.split(" ")[0] : "Cliente Look";
  const hubSubtitle = hasRealMap && mapOverride.subtitle ? mapOverride.subtitle : "Mapa de ações";
  const activeCategory = visibleCategories.find((category) => category.key === openCategory);
  const closePanel = () => setOpenCategory(null);

  return (
    <section className="white-panel actions-map-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Mapa de ações</p>
          <h3>Tudo o que está em andamento</h3>
        </div>
      </div>
      <p className="muted actions-map-hint">Toque em um círculo para ver os itens. Arraste para reorganizar, use os controles para dar zoom.</p>

      {canvasCategories.length ? (
        <RadialActionCanvas hubTitle={hubTitle} hubSubtitle={hubSubtitle} categories={canvasCategories} />
      ) : (
        <div className="actions-map-empty-canvas">Ainda não há itens no mapa de ações deste cliente.</div>
      )}

      {activeCategory && (
        <div className="actions-map-backdrop" onClick={closePanel}>
          <aside className="actions-map-panel" onClick={(event) => event.stopPropagation()}>
            <div className="actions-map-panel-head">
              <div>
                <span className="actions-map-dot" style={{ background: activeCategory.color }} />
                <strong>{activeCategory.label}</strong>
              </div>
              <button onClick={closePanel} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div className="actions-map-panel-list">
              {activeCategory.items.length ? activeCategory.items.map((item, index) => (
                <div key={`${item.title}-${index}`}>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
              )) : (
                <div className="actions-map-empty">Nenhum item nesta categoria no momento.</div>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
