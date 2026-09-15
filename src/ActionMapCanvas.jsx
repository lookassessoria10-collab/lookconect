import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  BarChart3, Briefcase, Building2, CalendarDays, FileText, Globe, Handshake, Heart, Lightbulb,
  Megaphone, Newspaper, Package, Plus, Settings2, Share2, Target, TriangleAlert, Users, X
} from "lucide-react";
import { ACTION_MAP_CATEGORIES, ACTION_ITEM_TYPES } from "./actionMapCategories";

const CATEGORY_ICONS = {
  objetivos: Target,
  publico_alvo: Users,
  canais: Share2,
  recursos: Settings2,
  acoes: Lightbulb,
  resultados: BarChart3,
  riscos: TriangleAlert
};

const ITEM_TYPE_ICONS = {
  conteudo: FileText,
  midia: Megaphone,
  relacionamento: Heart,
  comercial: Briefcase,
  imprensa: Newspaper,
  evento: CalendarDays,
  parceria: Handshake,
  material_fisico: Package,
  digital: Globe,
  institucional: Building2
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

function TypePicker({ value, onPick, color }) {
  return (
    <div className="action-type-picker" style={{ "--node-color": color }}>
      {ACTION_ITEM_TYPES.map((type) => {
        const Icon = ITEM_TYPE_ICONS[type.key];
        return (
          <button
            key={type.key}
            type="button"
            className={value === type.key ? "active" : ""}
            title={type.label}
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(type.key);
            }}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}

function ItemNode({ data }) {
  const [editing, setEditing] = useState(Boolean(data.autoEdit));
  const [draft, setDraft] = useState(data.title);
  const [draftType, setDraftType] = useState(data.itemType ?? null);
  const inputRef = useRef(null);
  const Icon = data.itemType ? ITEM_TYPE_ICONS[data.itemType] : null;

  const commit = () => {
    const text = draft.trim();
    setEditing(false);
    if (!text) {
      data.onDelete();
      return;
    }
    if (text !== data.title || draftType !== data.itemType) data.onRename(text, draftType);
  };

  if (editing) {
    return (
      <div className="action-node action-node-item editing nodrag" style={{ "--node-color": data.color, "--node-tint": data.tint }}>
        <AllHandles />
        <TypePicker value={draftType} onPick={setDraftType} color={data.color} />
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
      {Icon && <Icon size={13} className="action-node-item-icon" />}
      <span>{data.title}</span>
      <button type="button" className="action-node-remove nodrag" onClick={data.onDelete} aria-label={`Remover ${data.title}`}>
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
  const radius = 260;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
}

function defaultItemPosition(categoryPos, index, total) {
  const radius = 150;
  const baseAngle = Math.atan2(categoryPos.y, categoryPos.x);
  const perpAngle = baseAngle + Math.PI / 2;
  const spread = (index - (total - 1) / 2) * 56;
  return {
    x: Math.round(categoryPos.x + Math.cos(baseAngle) * radius + Math.cos(perpAngle) * spread),
    y: Math.round(categoryPos.y + Math.sin(baseAngle) * radius + Math.sin(perpAngle) * spread)
  };
}

function buildNodes(props, previousNodes) {
  const { hubTitle, hubSubtitle, itemsByCategory, categoryLayout, onMoveCategory, onMoveItem, onAddItem, onRenameItem, onDeleteItem, autoEditId } = props;
  const prevById = new Map(previousNodes.map((node) => [node.id, node]));
  const nodes = [
    { id: "hub", type: "hub", position: { x: 0, y: 0 }, draggable: false, data: { title: hubTitle, subtitle: hubSubtitle } }
  ];

  ACTION_MAP_CATEGORIES.forEach((category, index) => {
    const storedCategoryPos = categoryLayout?.[category.key];
    const categoryPos = storedCategoryPos ?? prevById.get(category.key)?.position ?? defaultCategoryPosition(index, ACTION_MAP_CATEGORIES.length);
    nodes.push({
      id: category.key,
      type: "category",
      position: categoryPos,
      data: { categoryKey: category.key, label: category.label, color: category.color, tint: category.tint }
    });

    const items = itemsByCategory[category.key] ?? [];
    items.forEach((item, itemIndex) => {
      const storedItemPos = (item.x != null && item.y != null) ? { x: item.x, y: item.y } : null;
      const itemPos = storedItemPos ?? prevById.get(item.id)?.position ?? defaultItemPosition(categoryPos, itemIndex, items.length);
      nodes.push({
        id: item.id,
        type: "item",
        position: itemPos,
        data: {
          title: item.title,
          itemType: item.itemType,
          categoryKey: category.key,
          color: category.color,
          tint: category.tint,
          autoEdit: item.id === autoEditId,
          onRename: (text, itemType) => onRenameItem(category.key, item.id, text, itemType),
          onDelete: () => onDeleteItem(category.key, item.id)
        }
      });
    });

    const addPos = defaultItemPosition(categoryPos, items.length, items.length + 1);
    nodes.push({
      id: `add-${category.key}`,
      type: "addItem",
      position: addPos,
      draggable: false,
      data: { color: category.color, onAdd: () => onAddItem(category.key, addPos) }
    });
  });

  return nodes;
}

function buildEdges(nodes) {
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const edges = [];

  ACTION_MAP_CATEGORIES.forEach((category) => {
    const catNode = byId[category.key];
    if (!catNode) return;
    const hubCompass = nearestCompass(catNode.position.x, catNode.position.y);
    const categoryCompass = nearestCompass(-catNode.position.x, -catNode.position.y);
    edges.push({
      id: `hub-${category.key}`,
      source: "hub",
      sourceHandle: `src-${hubCompass}`,
      target: category.key,
      targetHandle: `tgt-${categoryCompass}`,
      type: "straight",
      style: { stroke: category.color, strokeWidth: 2 }
    });

    nodes.forEach((node) => {
      if (node.type !== "item" || node.data.categoryKey !== category.key) return;
      const dx = node.position.x - catNode.position.x;
      const dy = node.position.y - catNode.position.y;
      const fromCompass = nearestCompass(dx, dy);
      const toCompass = nearestCompass(-dx, -dy);
      edges.push({
        id: `${category.key}-${node.id}`,
        source: category.key,
        sourceHandle: `src-${fromCompass}`,
        target: node.id,
        targetHandle: `tgt-${toCompass}`,
        type: "straight",
        style: { stroke: category.color, strokeWidth: 1.4, opacity: 0.7 }
      });
    });

    const addNode = byId[`add-${category.key}`];
    if (addNode) {
      const dx = addNode.position.x - catNode.position.x;
      const dy = addNode.position.y - catNode.position.y;
      edges.push({
        id: `${category.key}-add`,
        source: category.key,
        sourceHandle: `src-${nearestCompass(dx, dy)}`,
        target: addNode.id,
        targetHandle: `tgt-${nearestCompass(-dx, -dy)}`,
        type: "straight",
        animated: true,
        style: { stroke: category.color, strokeWidth: 1, opacity: 0.4, strokeDasharray: "3 4" }
      });
    }
  });

  return edges;
}

function structuralSignature(props) {
  const items = Object.entries(props.itemsByCategory)
    .map(([key, list]) => `${key}:${list.map((item) => `${item.id}|${item.title}|${item.itemType ?? ""}|${item.x ?? ""}|${item.y ?? ""}`).join(",")}`)
    .join(";");
  return `${props.hubTitle}::${props.hubSubtitle}::${JSON.stringify(props.categoryLayout)}::${items}::${props.autoEditId ?? ""}`;
}

function ActionMapCanvasInner(props) {
  const { onMoveCategory, onMoveItem } = props;
  const [nodes, setNodes] = useState(() => buildNodes(props, []));
  const signature = structuralSignature(props);
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setNodes((current) => buildNodes(props, current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const edges = useMemo(() => buildEdges(nodes), [nodes]);

  const onNodesChange = useCallback((changes) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

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
        onNodesChange={onNodesChange}
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
