/** OpenAI-compatible base URL (server-side or when not using the dev proxy) */
export const GROQ_BASE = 'https://api.groq.com/openai/v1';

/** Fast, capable chat model on Groq free tier */
export const GROQ_CHAT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Chat completions URL. In the browser we default to same-origin `/api/groq/...` so Vite can proxy
 * and avoid Groq blocking cross-origin requests (CORS). Override with VITE_GROQ_CHAT_URL if needed.
 *
 * @returns {string}
 */
export function getGroqChatCompletionsUrl() {
  const override = import.meta.env.VITE_GROQ_CHAT_URL;
  if (override && String(override).trim() !== '') {
    return String(override).trim();
  }
  if (typeof window !== 'undefined') {
    return '/api/groq/chat/completions';
  }
  return `${GROQ_BASE}/chat/completions`;
}

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
