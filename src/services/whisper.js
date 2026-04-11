import { GROQ_BASE, GROQ_WHISPER_MODEL, getGroqApiKey } from './groqClient.js';

const TRANSCRIBE_URL = `${GROQ_BASE}/audio/transcriptions`;

/**
 * Transcribe audio with Groq (Whisper-compatible API).
 * @param {Blob} audioBlob
 * @returns {Promise<string>}
 */
export async function transcribeAudio(audioBlob) {
  const apiKey = getGroqApiKey();

  if (!navigator.onLine) {
    throw new Error('You appear to be offline. Check your connection and try again.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', GROQ_WHISPER_MODEL);

  let response;
  try {
    response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });
  } catch {
    throw new Error('Could not reach the transcription service. Check your network and try again.');
  }

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Transcription failed (${response.status}). Please try again.`);
  }

  if (!response.ok) {
    const msg = data?.error?.message || raw.slice(0, 280);
    throw new Error(`Transcription failed (${response.status}): ${msg}`);
  }

  if (typeof data.text !== 'string') {
    throw new Error('Unexpected response from transcription service.');
  }
  return data.text;
}
