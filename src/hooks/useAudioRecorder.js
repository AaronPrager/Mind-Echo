import { useCallback, useRef, useState } from 'react';

function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm'];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

/**
 * @returns {{
 *   isRecording: boolean,
 *   startRecording: () => Promise<void>,
 *   stopRecording: () => Promise<Blob | null>,
 *   audioBlob: Blob | null,
 *   error: string | null,
 *   clearError: () => void
 * }}
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  const startRecording = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support microphone recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      setIsRecording(true);
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'name' in e && e.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
          : 'Could not access the microphone. Check permissions and try again.';
      setError(msg);
      throw e;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') {
      setIsRecording(false);
      return null;
    }

    return new Promise((resolve) => {
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const type = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        setAudioBlob(blob);
        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve(blob);
      };
      mr.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording, audioBlob, error, clearError };
}
