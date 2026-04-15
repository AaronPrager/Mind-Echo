import styles from '../styles/mindmap.module.css';

export function MindMapControls({ onFitView, onZoomIn, onZoomOut, onStartOver }) {
  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <button type="button" onClick={onZoomIn}>
          Zoom in
        </button>
        <button type="button" onClick={onZoomOut}>
          Zoom out
        </button>
      </div>
      <button type="button" onClick={onFitView}>
        Fit view
      </button>
      <button type="button" className={styles.newBtn} onClick={onStartOver}>
        Start over
      </button>
    </div>
  );
}
