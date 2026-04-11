import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import styles from '../styles/customNode.module.css';

function Tooltip({ visible, text, placement }) {
  if (!visible || !text) return null;
  return (
    <div
      className={`${styles.tooltip} ${placement === 'below' ? styles.tooltipBelow : styles.tooltipAbove}`}
      style={{ pointerEvents: 'none' }}
    >
      <span className={styles.tooltipArrow} aria-hidden />
      <div className={styles.tooltipInner}>{text}</div>
    </div>
  );
}

function CustomNodeComponent({ data }) {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState('above');
  const rootRef = useRef(null);

  const nodeType = data?.nodeType ?? 'concept';
  const delay = `${(data?.animationIndex ?? 0) * 0.06}s`;

  const updatePlacement = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPlacement(rect.top < 120 ? 'below' : 'above');
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePlacement();
    const onScroll = () => updatePlacement();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [visible, updatePlacement]);

  const shellClass =
    nodeType === 'center'
      ? styles.center
      : nodeType === 'subtopic'
        ? styles.subtopic
        : styles.concept;

  const description = typeof data?.description === 'string' ? data.description : '';

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${shellClass}`}
      style={{ animationDelay: delay }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
      <div className={styles.label}>{data?.label}</div>
      <Tooltip visible={visible} text={description} placement={placement} />
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
