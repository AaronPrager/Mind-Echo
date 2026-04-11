import { useRapidTypewriter } from '../hooks/useRapidTypewriter';
import { useNodeHover } from '../context/NodeHoverContext';
import { MindMapControls } from './MindMapControls';
import { useReactFlow } from 'reactflow';
import styles from '../styles/mindmap.module.css';

function ControlsWithFlow({ onNewRecording }) {
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

export function MindMapSidePanel({ onNewRecording }) {
  const { hovered } = useNodeHover();
  const descTarget = hovered?.description ?? '';
  const animationKey = hovered?.id ?? '';
  const animated = useRapidTypewriter(descTarget, animationKey);

  const typing =
    (hovered && hovered.description !== animated) ||
    (!hovered && animated.length > 0);

  const showIdleHint = !hovered && animated.length === 0;

  return (
    <aside className={styles.sidePanel} aria-label="Map controls and node details">
      <div className={styles.sidePanelHeader}>Mind Echo</div>
      <ControlsWithFlow onNewRecording={onNewRecording} />
      <div className={styles.detailSection}>
        {hovered ? (
          <div className={styles.detailLabel}>{hovered.label}</div>
        ) : (
          <div className={styles.detailLabelMuted}>Node details</div>
        )}
        <div className={styles.detailBox} aria-live="polite" aria-atomic="true">
          {showIdleHint ? (
            <p className={styles.detailPlaceholder}>Hover a node to read its description here.</p>
          ) : (
            <p className={styles.detailText}>
              {animated}
              {typing ? <span className={styles.typeCursor} aria-hidden /> : null}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
