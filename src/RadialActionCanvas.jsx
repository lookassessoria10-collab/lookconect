import React, { useMemo } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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
    <button type="button" className="map-category-node" style={{ "--node-color": data.color }} onClick={data.onOpen}>
      <Handle type="target" position={targetPosition ?? Position.Top} style={{ opacity: 0 }} />
      <strong>{data.label}</strong>
      <span>{data.count} {data.count === 1 ? "item" : "itens"}</span>
    </button>
  );
}

const nodeTypes = { hub: HubNode, category: CategoryNode };

function buildGraph(categories, hubTitle, hubSubtitle) {
  const radius = 220;
  const nodes = [
    { id: "hub", type: "hub", position: { x: 0, y: 0 }, data: { title: hubTitle, subtitle: hubSubtitle }, draggable: false }
  ];
  const edges = [];

  categories.forEach((category, index) => {
    const angle = (2 * Math.PI * index) / Math.max(categories.length, 1) - Math.PI / 2;
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
        count: category.count,
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

function RadialActionCanvasInner({ hubTitle, hubSubtitle, categories }) {
  const { nodes, edges } = useMemo(
    () => buildGraph(categories, hubTitle, hubSubtitle),
    [categories, hubTitle, hubSubtitle]
  );

  return (
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
  );
}

export default function RadialActionCanvas(props) {
  return (
    <ReactFlowProvider>
      <RadialActionCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
