import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../context/NodeHoverContext';
import styles from '../styles/customNode.module.css';

function CustomNodeComponent({ id, data }) {
  const { hovered } = useNodeHover();
  const isHovered = hovered?.id === id;

  const nodeType = data?.nodeType ?? 'concept';
  const delay = `${(data?.animationIndex ?? 0) * 0.06}s`;

  const shellClass =
    nodeType === 'center'
      ? styles.center
      : nodeType === 'subtopic'
        ? styles.subtopic
        : styles.concept;

  const glowClass =
    isHovered && nodeType === 'center'
      ? styles.hoveredCenter
      : isHovered && nodeType === 'subtopic'
        ? styles.hoveredSubtopic
        : isHovered
          ? styles.hoveredConcept
          : '';

  return (
    <div
      className={`${styles.root} ${shellClass} ${glowClass}`.trim()}
      style={{ animationDelay: delay }}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
      <div className={styles.label}>{data?.label}</div>
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
