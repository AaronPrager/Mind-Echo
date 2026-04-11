/** OpenAI-compatible base URL */
export const GROQ_BASE = 'https://api.groq.com/openai/v1';

/** Speech: Groq-hosted Whisper (supports webm, etc.) */
export const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

/** Fast, capable chat model on Groq free tier */
export const GROQ_CHAT_MODEL = 'llama-3.3-70b-versatile';

/**
 * @returns {string}
 */
export function getGroqApiKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || String(key).trim() === '') {
    throw new Error(
      'Missing API key. Add VITE_GROQ_API_KEY to your .env file (free key: https://console.groq.com/keys).'
    );
  }
  return String(key).trim();
}
