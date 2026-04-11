import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { CircleStraightEdge } from '../components/CircleStraightEdge';
import { CustomNode } from '../components/CustomNode';
import { MindMapSidePanel } from '../components/MindMapSidePanel';
import { NodeHoverProvider, useNodeHover } from '../context/NodeHoverContext';
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

function FlowInner({ mapData, onNewRecording }) {
  const { setHovered, scheduleClearHover } = useNodeHover();
  const laidOut = useMemo(() => computeLayout(mapData), [mapData]);
  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(laidOut.edges);

  useEffect(() => {
    const next = computeLayout(mapData);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [mapData, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ circleStraight: CircleStraightEdge }), []);

  const onInit = useCallback((instance) => {
    requestAnimationFrame(() => instance.fitView({ padding: 0.25 }));
  }, []);

  const onNodeMouseEnter = useCallback(
    (_event, node) => {
      const label = typeof node.data?.label === 'string' ? node.data.label : '';
      const description = typeof node.data?.description === 'string' ? node.data.description : '';
      setHovered({ id: node.id, label, description });
    },
    [setHovered]
  );

  const onNodeMouseLeave = useCallback(() => {
    scheduleClearHover();
  }, [scheduleClearHover]);

  return (
    <div className={styles.layout}>
      <div className={styles.flowMain}>
        <ReactFlow
          className={styles.flowFill}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          style={{ background: '#000000' }}
        >
          <FitViewOnDataChange mapData={mapData} nodeCount={nodes.length} />
        </ReactFlow>
      </div>
      <MindMapSidePanel onNewRecording={onNewRecording} />
    </div>
  );
}

export function MindMapScreen({ mapData, onNewRecording }) {
  return (
    <ReactFlowProvider>
      <NodeHoverProvider>
        <FlowInner mapData={mapData} onNewRecording={onNewRecording} />
      </NodeHoverProvider>
    </ReactFlowProvider>
  );
}
