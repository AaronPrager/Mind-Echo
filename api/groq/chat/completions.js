/**
 * Vercel serverless: proxies POST /api/groq/chat/completions → Groq OpenAI-compatible API.
 * The Vite dev proxy only exists locally; production needs this handler or you get 404.
 *
 * Prefer setting GROQ_API_KEY in Vercel (server-only). Otherwise the Authorization header
 * from the client is forwarded (same as local dev with VITE_GROQ_API_KEY).
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const serverKey = process.env.GROQ_API_KEY?.trim();
  const authorization = serverKey ? `Bearer ${serverKey}` : req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message:
          'Missing API key. Set GROQ_API_KEY in Vercel Environment Variables, or VITE_GROQ_API_KEY so the client sends Authorization.',
      },
    });
  }

  let body = req.body;
  if (body === undefined || body === null) {
    return res.status(400).json({ error: { message: 'Missing request body' } });
  }
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: { message: 'Invalid JSON body' } });
    }
  }

  try {
    const r = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    const ct = r.headers.get('content-type') || 'application/json';
    res.status(r.status);
    res.setHeader('Content-Type', ct);
    return res.send(text);
  } catch (e) {
    console.error('[groq proxy]', e);
    return res.status(502).json({
      error: { message: e instanceof Error ? e.message : 'Proxy error' },
    });
  }
}
