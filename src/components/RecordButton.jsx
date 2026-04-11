import styles from '../styles/recordButton.module.css';

export function RecordButton({ isRecording, onToggle, disabled }) {
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isRecording}
    >
      {isRecording ? 'Stop recording' : 'Start recording'}
    </button>
  );
}
