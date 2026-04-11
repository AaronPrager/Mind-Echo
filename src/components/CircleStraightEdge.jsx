import { memo, useMemo } from 'react';
import { BaseEdge, useStore } from 'reactflow';

function radiusPx(node) {
  const w = node?.width;
  const h = node?.height;
  if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
    return Math.min(w, h) / 2;
  }
  switch (node?.data?.nodeType) {
    case 'center':
      return 80;
    case 'subtopic':
      return 60;
    case 'concept':
      return 45;
    default:
      return 45;
  }
}

function topLeft(node) {
  const p = node.positionAbsolute ?? node.position;
  return { x: p.x, y: p.y };
}

function CircleStraightEdgeInner({ id, source, target, style, markerEnd, interactionWidth = 22 }) {
  const sourceNode = useStore((s) => s.nodeInternals.get(source));
  const targetNode = useStore((s) => s.nodeInternals.get(target));

  const { path, labelX, labelY } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return { path: '', labelX: 0, labelY: 0 };
    }

    const a = topLeft(sourceNode);
    const b = topLeft(targetNode);
    const wa = sourceNode.width ?? radiusPx(sourceNode) * 2;
    const ha = sourceNode.height ?? wa;
    const wb = targetNode.width ?? radiusPx(targetNode) * 2;
    const hb = targetNode.height ?? wb;

    const ax = a.x + wa / 2;
    const ay = a.y + ha / 2;
    const bx = b.x + wb / 2;
    const by = b.y + hb / 2;

    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (!Number.isFinite(len) || len < 1e-6) {
      return { path: '', labelX: ax, labelY: ay };
    }

    const ux = dx / len;
    const uy = dy / len;
    const rs = radiusPx(sourceNode);
    const rt = radiusPx(targetNode);

    if (len <= rs + rt) {
      return { path: '', labelX: (ax + bx) / 2, labelY: (ay + by) / 2 };
    }

    const x1 = ax + ux * rs;
    const y1 = ay + uy * rs;
    const x2 = bx - ux * rt;
    const y2 = by - uy * rt;

    return {
      path: `M ${x1},${y1} L ${x2},${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2,
    };
  }, [sourceNode, targetNode]);

  if (!path) {
    return null;
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      labelX={labelX}
      labelY={labelY}
      style={style}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  );
}

export const CircleStraightEdge = memo(CircleStraightEdgeInner);
CircleStraightEdge.displayName = 'CircleStraightEdge';
