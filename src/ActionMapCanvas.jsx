import React, { useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BarChart3, Lightbulb, Plus, Settings2, Share2, Target, TriangleAlert, Users, X } from "lucide-react";
import { ACTION_MAP_CATEGORIES } from "./actionMapCategories";

const CATEGORY_ICONS = {
  objetivos: Target,
  publico_alvo: Users,
  canais: Share2,
  recursos: Settings2,
  acoes: Lightbulb,
  resultados: BarChart3,
  riscos: TriangleAlert
};

const HANDLE_POSITIONS = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left }
];

function nearestCompass(dx, dy) {
  const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  if (angle >= 45 && angle < 135) return "bottom";
  if (angle >= 135 && angle < 225) return "left";
  if (angle >= 225 && angle < 315) return "top";
  return "right";
}

function AllHandles() {
  return (
    <>
      {HANDLE_POSITIONS.map(({ id, position }) => (
        <React.Fragment key={id}>
          <Handle id={`src-${id}`} type="source" position={position} style={{ opacity: 0 }} />
          <Handle id={`tgt-${id}`} type="target" position={position} style={{ opacity: 0 }} />
        </React.Fragment>
      ))}
    </>
  );
}

function HubNode({ data }) {
  return (
    <div className="action-node action-node-hub">
      <AllHandles />
      <strong>{data.title}</strong>
      <span>{data.subtitle}</span>
    </div>
  );
}

function CategoryNode({ data }) {
  const Icon = CATEGORY_ICONS[data.categoryKey] ?? Target;
  return (
    <div
      className="action-node action-node-category"
      style={{ "--node-color": data.color, "--node-tint": data.tint }}
    >
      <AllHandles />
      <Icon size={18} />
      <strong>{data.label}</strong>
    </div>
  );
}

function ItemNode({ data }) {
  const [editing, setEditing] = useState(Boolean(data.autoEdit));
  const [draft, setDraft] = useState(data.title);
  const inputRef = useRef(null);

  const commit = () => {
    const text = draft.trim();
    setEditing(false);
    if (text && text !== data.title) data.onRename(text);
    else if (!text) data.onDelete();
  };

  if (editing) {
    return (
      <div className="action-node action-node-item editing" style={{ "--node-color": data.color, "--node-tint": data.tint }}>
        <AllHandles />
        <input
          ref={(el) => {
            inputRef.current = el;
            el?.focus();
          }}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") {
              setDraft(data.title);
              setEditing(false);
              if (!data.title) data.onDelete();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="action-node action-node-item"
      style={{ "--node-color": data.color, "--node-tint": data.tint }}
      onDoubleClick={() => setEditing(true)}
    >
      <AllHandles />
      <span>{data.title}</span>
      <button type="button" className="action-node-remove" onClick={data.onDelete} aria-label={`Remover ${data.title}`}>
        <X size={11} />
      </button>
    </div>
  );
}

function AddItemNode({ data }) {
  return (
    <button
      type="button"
      className="action-node action-node-add"
      style={{ "--node-color": data.color }}
      onClick={data.onAdd}
    >
      <AllHandles />
      <Plus size={14} /> Novo item
    </button>
  );
}

const nodeTypes = { hub: HubNode, category: CategoryNode, item: ItemNode, addItem: AddItemNode };

function defaultCategoryPosition(index, total) {
  const radius = 240;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
}

function defaultItemPosition(categoryPos, index, total) {
  const radius = 130;
  const baseAngle = Math.atan2(categoryPos.y, categoryPos.x);
  const perpAngle = baseAngle + Math.PI / 2;
  const spread = (index - (total - 1) / 2) * 40;
  return {
    x: Math.round(categoryPos.x + Math.cos(baseAngle) * radius + Math.cos(perpAngle) * spread),
    y: Math.round(categoryPos.y + Math.sin(baseAngle) * radius + Math.sin(perpAngle) * spread)
  };
}

function buildScene({ hubTitle, hubSubtitle, itemsByCategory, categoryLayout, onMoveCategory, onMoveItem, onAddItem, onRenameItem, onDeleteItem, autoEditId }) {
  const nodes = [
    { id: "hub", type: "hub", position: { x: 0, y: 0 }, draggable: false, data: { title: hubTitle, subtitle: hubSubtitle } }
  ];
  const positionsById = { hub: { x: 0, y: 0 } };

  ACTION_MAP_CATEGORIES.forEach((category, index) => {
    const pos = categoryLayout?.[category.key] ?? defaultCategoryPosition(index, ACTION_MAP_CATEGORIES.length);
    positionsById[category.key] = pos;
    nodes.push({
      id: category.key,
      type: "category",
      position: pos,
      data: { categoryKey: category.key, label: category.label, color: category.color, tint: category.tint }
    });

    const items = itemsByCategory[category.key] ?? [];
    items.forEach((item, itemIndex) => {
      const itemPos = (item.x != null && item.y != null) ? { x: item.x, y: item.y } : defaultItemPosition(pos, itemIndex, items.length);
      positionsById[item.id] = itemPos;
      nodes.push({
        id: item.id,
        type: "item",
        position: itemPos,
        data: {
          title: item.title,
          color: category.color,
          tint: category.tint,
          autoEdit: item.id === autoEditId,
          onRename: (text) => onRenameItem(category.key, item.id, text),
          onDelete: () => onDeleteItem(category.key, item.id)
        }
      });
    });

    const addPos = defaultItemPosition(pos, items.length, items.length + 1);
    nodes.push({
      id: `add-${category.key}`,
      type: "addItem",
      position: addPos,
      draggable: false,
      data: { color: category.color, onAdd: () => onAddItem(category.key, addPos) }
    });
  });

  const edges = [];
  ACTION_MAP_CATEGORIES.forEach((category) => {
    const hubCompass = nearestCompass(positionsById[category.key].x, positionsById[category.key].y);
    const categoryCompass = nearestCompass(-positionsById[category.key].x, -positionsById[category.key].y);
    edges.push({
      id: `hub-${category.key}`,
      source: "hub",
      sourceHandle: `src-${hubCompass}`,
      target: category.key,
      targetHandle: `tgt-${categoryCompass}`,
      type: "straight",
      style: { stroke: category.color, strokeWidth: 2 }
    });

    const items = itemsByCategory[category.key] ?? [];
    items.forEach((item) => {
      const itemPos = positionsById[item.id];
      const catPos = positionsById[category.key];
      const dx = itemPos.x - catPos.x;
      const dy = itemPos.y - catPos.y;
      const fromCompass = nearestCompass(dx, dy);
      const toCompass = nearestCompass(-dx, -dy);
      edges.push({
        id: `${category.key}-${item.id}`,
        source: category.key,
        sourceHandle: `src-${fromCompass}`,
        target: item.id,
        targetHandle: `tgt-${toCompass}`,
        type: "straight",
        style: { stroke: category.color, strokeWidth: 1.4, opacity: 0.7 }
      });
    });

    const addPos = positionsById[`add-${category.key}`] ?? defaultItemPosition(positionsById[category.key], items.length, items.length + 1);
    const dxAdd = addPos.x - positionsById[category.key].x;
    const dyAdd = addPos.y - positionsById[category.key].y;
    edges.push({
      id: `${category.key}-add`,
      source: category.key,
      sourceHandle: `src-${nearestCompass(dxAdd, dyAdd)}`,
      target: `add-${category.key}`,
      targetHandle: `tgt-${nearestCompass(-dxAdd, -dyAdd)}`,
      type: "straight",
      style: { stroke: category.color, strokeWidth: 1, opacity: 0.35, strokeDasharray: "3 4" }
    });
  });

  return { nodes, edges };
}

function ActionMapCanvasInner(props) {
  const { hubTitle, hubSubtitle, itemsByCategory, categoryLayout, onMoveCategory, onMoveItem } = props;

  const { nodes, edges } = useMemo(() => buildScene(props), [
    hubTitle, hubSubtitle, itemsByCategory, categoryLayout, props.autoEditId
  ]);

  const handleNodeDragStop = (_event, node) => {
    if (node.type === "category") onMoveCategory(node.id, node.position.x, node.position.y);
    if (node.type === "item") onMoveItem(node.id, node.position.x, node.position.y);
  };

  return (
    <div className="actions-map-canvas action-map-canvas-rich">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => instance.fitView({ padding: 0.3 })}
        minZoom={0.15}
        maxZoom={1.5}
        nodesConnectable={false}
        elementsSelectable
        onNodeDragStop={handleNodeDragStop}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function ActionMapCanvas(props) {
  return (
    <ReactFlowProvider>
      <ActionMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
