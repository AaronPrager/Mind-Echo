import { StaticMindMapGraphic } from '../components/StaticMindMapGraphic';
import styles from '../styles/landing.module.css';

export function LandingScreen({ onGenerateMindMap }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Mind Echo</h1>

      <div className={styles.graphicWrap} aria-hidden>
        <StaticMindMapGraphic />
      </div>

      <p className={styles.instruction}>
        Edit your source text in <code className={styles.code}>src/userTranscript.js</code> (the{' '}
        <code className={styles.code}>USER_TEXT</code> string), save the file, then generate your
        mind map.
      </p>

      <button type="button" className={styles.generateBtn} onClick={onGenerateMindMap}>
        Generate mind map
      </button>
    </div>
  );
}
