import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Panel, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from '../components/CustomNode';
import { MindMapControls } from '../components/MindMapControls';
import { computeLayout } from '../utils/layoutUtils';
import styles from '../styles/mindmap.module.css';

const defaultViewport = { x: 0, y: 0, zoom: 0.85 };

function FitViewOnDataChange({ mapData, nodeCount }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const id = requestAnimationFrame(() => fitView({ padding: 0.25 }));
    return () => cancelAnimationFrame(id);
  }, [mapData, nodeCount, fitView]);
  return null;
}

function MindMapControlsInner({ onNewRecording }) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  return (
    <MindMapControls
      onFitView={() => fitView({ padding: 0.2 })}
      onZoomIn={() => zoomIn()}
      onZoomOut={() => zoomOut()}
      onNewRecording={onNewRecording}
    />
  );
}

function FlowInner({ mapData, onNewRecording }) {
  const laidOut = useMemo(() => computeLayout(mapData), [mapData]);
  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(laidOut.edges);

  useEffect(() => {
    const next = computeLayout(mapData);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [mapData, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const onInit = useCallback((instance) => {
    requestAnimationFrame(() => instance.fitView({ padding: 0.25 }));
  }, []);

  return (
    <div className={styles.canvas}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={2}
        panOnDrag
        zoomOnScroll
        attributionPosition="bottom-left"
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onInit={onInit}
        style={{ background: '#000000' }}
      >
        <FitViewOnDataChange mapData={mapData} nodeCount={nodes.length} />
        <Panel position="top-right">
          <MindMapControlsInner onNewRecording={onNewRecording} />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function MindMapScreen({ mapData, onNewRecording }) {
  return (
    <ReactFlowProvider>
      <FlowInner mapData={mapData} onNewRecording={onNewRecording} />
    </ReactFlowProvider>
  );
}
