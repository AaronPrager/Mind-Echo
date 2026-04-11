import styles from '../styles/staticGraphic.module.css';

export function StaticMindMapGraphic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      focusable="false"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <g className={styles.breathe}>
        <path
          d="M 160 160 Q 200 120 230 95"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <path
          d="M 160 160 Q 200 200 235 225"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <path
          d="M 160 160 Q 120 120 85 100"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <path
          d="M 160 160 Q 120 200 80 230"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <path
          d="M 160 160 Q 160 210 160 255"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          filter="url(#glow)"
        />

        <circle className={styles.child} cx="230" cy="95" r="18" />
        <circle className={styles.child} cx="235" cy="225" r="16" />
        <circle className={styles.child} cx="85" cy="100" r="17" />
        <circle className={styles.child} cx="80" cy="230" r="16" />
        <circle className={styles.child} cx="160" cy="255" r="15" />

        <circle className={styles.center} cx="160" cy="160" r="36" />
      </g>
    </svg>
  );
}
