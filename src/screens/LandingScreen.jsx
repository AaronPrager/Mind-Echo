import { useState } from 'react';
import { RecordButton } from '../components/RecordButton';
import { StaticMindMapGraphic } from '../components/StaticMindMapGraphic';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import styles from '../styles/landing.module.css';

export function LandingScreen({ onRecordingComplete }) {
  const { isRecording, startRecording, stopRecording, error, clearError } = useAudioRecorder();
  const [shortWarning, setShortWarning] = useState(false);

  const handleToggle = async () => {
    clearError();
    setShortWarning(false);
    if (!isRecording) {
      try {
        await startRecording();
      } catch {
        /* error state set in hook */
      }
      return;
    }

    const blob = await stopRecording();
    if (!blob) return;
    if (blob.size < 1024) {
      setShortWarning(true);
      return;
    }
    onRecordingComplete(blob);
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Mind Echo</h1>

      <button
        type="button"
        className={styles.graphicWrap}
        onClick={handleToggle}
        aria-label={isRecording ? 'Stop recording' : 'Start recording — click the mind map'}
      >
        {isRecording && <span className={styles.recordingRing} aria-hidden />}
        <StaticMindMapGraphic />
      </button>

      <p className={styles.instruction}>Click to start recording your thoughts</p>

      <RecordButton isRecording={isRecording} onToggle={handleToggle} disabled={false} />

      {error && <div className={styles.micError}>{error}</div>}
      {shortWarning && (
        <div className={styles.shortError}>
          That recording was too short. Please speak a little longer, then try again.
        </div>
      )}
    </div>
  );
}
