import styles from '../styles/error.module.css';

export function ErrorScreen({ message, onRetry }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.msg}>{message}</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
