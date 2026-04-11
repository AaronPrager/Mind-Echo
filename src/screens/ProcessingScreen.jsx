import { useEffect, useState } from 'react';
import { useMindMapData } from '../hooks/useMindMapData';
import styles from '../styles/processing.module.css';

const MESSAGES = {
  1: 'Transcribing your audio...',
  2: 'Building your mind map...',
  3: 'Almost there...',
};

export function ProcessingScreen({ audioBlob, onSuccess, onError }) {
  const [stage, setStage] = useState(1);
  const { processAudio } = useMindMapData();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await processAudio(audioBlob, (s) => {
          if (!cancelled) setStage(s);
        });
        if (!cancelled) onSuccess(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
        if (!cancelled) onError(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioBlob, processAudio, onSuccess, onError]);

  return (
    <div className={styles.wrap}>
      <div className={styles.rings} aria-hidden>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>
      <p className={styles.status}>{MESSAGES[stage] ?? MESSAGES[1]}</p>
    </div>
  );
}
