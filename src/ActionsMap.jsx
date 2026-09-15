import React, { useMemo, useState, useCallback } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X } from "lucide-react";

const CATEGORY_COLORS = {
  estrategia: "#3457d5",
  conteudo: "#1fae74",
  aprovacoes: "#d1892f",
  trafego: "#0f7c8f"
};

function angleDeg(angleRad) {
  return ((angleRad * 180) / Math.PI + 360) % 360;
}

function compassFromAngle(angleRad) {
  const deg = angleDeg(angleRad);
  if (deg >= 45 && deg < 135) return "bottom";
  if (deg >= 135 && deg < 225) return "left";
  if (deg >= 225 && deg < 315) return "top";
  return "right";
}

function oppositePosition(compass) {
  const map = { top: Position.Bottom, bottom: Position.Top, left: Position.Right, right: Position.Left };
  return map[compass];
}

function positionFromCompass(compass) {
  const map = { top: Position.Top, bottom: Position.Bottom, left: Position.Left, right: Position.Right };
  return map[compass];
}

function HubNode({ data }) {
  return (
    <div className="map-hub-node">
      {["top", "right", "bottom", "left"].map((compass) => (
        <Handle
          key={compass}
          id={`src-${compass}`}
          type="source"
          position={positionFromCompass(compass)}
          style={{ opacity: 0 }}
        />
      ))}
      <strong>{data.title}</strong>
      <span>{data.subtitle}</span>
    </div>
  );
}

function CategoryNode({ data, targetPosition }) {
  return (
    <button className="map-category-node" style={{ "--node-color": data.color }} onClick={data.onOpen}>
      <Handle type="target" position={targetPosition ?? Position.Top} style={{ opacity: 0 }} />
      <strong>{data.label}</strong>
      <span>{data.count} {data.count === 1 ? "item" : "itens"}</span>
    </button>
  );
}

const nodeTypes = { hub: HubNode, category: CategoryNode };

function buildGraph(categories, hubTitle, hubSubtitle) {
  const radius = 220;
  const visible = categories.filter((category) => category.items.length > 0);
  const nodes = [
    { id: "hub", type: "hub", position: { x: 0, y: 0 }, data: { title: hubTitle, subtitle: hubSubtitle }, draggable: false }
  ];
  const edges = [];

  visible.forEach((category, index) => {
    const angle = (2 * Math.PI * index) / Math.max(visible.length, 1) - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    const hubCompass = compassFromAngle(angle);
    const nodeTargetPosition = oppositePosition(hubCompass);

    nodes.push({
      id: category.key,
      type: "category",
      position: { x, y },
      targetPosition: nodeTargetPosition,
      data: {
        label: category.label,
        color: category.color,
        count: category.items.length,
        onOpen: category.onOpen
      }
    });

    edges.push({
      id: `hub-${category.key}`,
      source: "hub",
      sourceHandle: `src-${hubCompass}`,
      target: category.key,
      type: "straight",
      style: { stroke: category.color, strokeWidth: 2 }
    });
  });

  return { nodes, edges };
}

function ActionsMapInner({ client, actions = [], fullPosts = [], trafficReport }) {
  const [openCategory, setOpenCategory] = useState(null);

  const categories = useMemo(() => {
    const pendingPosts = fullPosts.filter((post) => post.status !== "Publicado" && post.status !== "Aprovado");
    const campaigns = trafficReport?.campaigns ?? [];

    return [
      {
        key: "estrategia",
        label: "Ações estratégicas",
        color: CATEGORY_COLORS.estrategia,
        items: actions.map((action) => ({ title: action.label, meta: `${action.value}% concluído` }))
      },
      {
        key: "conteudo",
        label: "Conteúdo",
        color: CATEGORY_COLORS.conteudo,
        items: fullPosts.map((post) => ({ title: post.title, meta: [post.weekday, post.date, post.status].filter(Boolean).join(" · ") }))
      },
      {
        key: "aprovacoes",
        label: "Aprovações",
        color: CATEGORY_COLORS.aprovacoes,
        items: pendingPosts.map((post) => ({ title: post.title, meta: post.status }))
      },
      {
        key: "trafego",
        label: "Tráfego pago",
        color: CATEGORY_COLORS.trafego,
        items: campaigns.map((campaign) => ({ title: campaign.name, meta: `${campaign.result} · ${campaign.status}` }))
      }
    ];
  }, [actions, fullPosts, trafficReport]);

  const categoriesWithHandlers = useMemo(
    () => categories.map((category) => ({ ...category, onOpen: () => setOpenCategory(category.key) })),
    [categories]
  );

  const hubTitle = client?.client ? client.client.split(" ")[0] : "Cliente Look";
  const { nodes, edges } = useMemo(
    () => buildGraph(categoriesWithHandlers, hubTitle, "Mapa de ações"),
    [categoriesWithHandlers, hubTitle]
  );

  const activeCategory = categories.find((category) => category.key === openCategory);
  const closePanel = useCallback(() => setOpenCategory(null), []);

  return (
    <section className="white-panel actions-map-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Mapa de ações</p>
          <h3>Tudo o que está em andamento</h3>
        </div>
      </div>
      <p className="muted actions-map-hint">Toque em um círculo para ver os itens. Arraste para reorganizar, use os controles para dar zoom.</p>
      <div className="actions-map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

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

export default function ActionsMap(props) {
  return (
    <ReactFlowProvider>
      <ActionsMapInner {...props} />
    </ReactFlowProvider>
  );
}
