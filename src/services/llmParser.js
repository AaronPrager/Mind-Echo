import { GROQ_CHAT_MODEL, getGroqApiKey, getGroqChatCompletionsUrl } from './groqClient.js';

/**
 * Groq caps `max_completion_tokens` (often 12k on free tier). Values above that are rejected
 * (e.g. "requested … tokens when the limit is 12000").
 */
const MAX_COMPLETION_TOKENS = 8000;

/** Rough char budget so huge pastes do not blow combined limits with completion. ~4 chars/token heuristic. */
const MAX_SOURCE_CHARS = 48000;

/**
 * @param {string} transcript
 * @returns {string}
 */
function clampSourceText(transcript) {
  const t = String(transcript ?? '');
  if (t.length <= MAX_SOURCE_CHARS) return t;
  return `${t.slice(0, MAX_SOURCE_CHARS)}\n\n[Text truncated for API limits — shorten src/userTranscript.js if you need the full document mapped.]`;
}

const SYSTEM_PROMPT = `You are an expert at extracting structured knowledge from written or spoken text and organizing it into mind maps.

Given the source text, identify the single main idea/topic, then 3 to 7 major subtopics, and for each subtopic 2 to 4 key concepts or facts.

Rules:
- centralTopic.label must be a SHORT title only (under 15 words). Never paste the full source text into label.
- centralTopic.description: 2–3 sentences summarizing the whole topic (not the entire source).
- Subtopic and concept labels must be short headings (under ~10 words). Descriptions: at most 2 sentences each.
- Be concise so the JSON stays compact.

Return ONLY a valid JSON object with this exact schema. No explanation, no markdown, no backticks, only raw JSON.

Schema:
{
  "centralTopic": {
    "id": "center",
    "label": "Main Topic (short, 2-5 words)",
    "description": "2-3 sentence summary of the entire topic"
  },
  "subtopics": [
    {
      "id": "node-1",
      "label": "Subtopic Label",
      "description": "1-2 sentence description of this subtopic",
      "concepts": [
        {
          "id": "node-1-1",
          "label": "Key Concept",
          "description": "Brief explanation of this concept"
        }
      ]
    }
  ]
}`;

/**
 * @param {string} raw
 * @returns {object | null}
 */
function parseAssistantJsonContent(raw) {
  const s = String(raw).trim();
  const attempts = [
    () => JSON.parse(s),
    () => {
      const m = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
      if (!m) throw new Error('no fence');
      return JSON.parse(m[1].trim());
    },
    () => {
      const start = s.indexOf('{');
      const end = s.lastIndexOf('}');
      if (start === -1 || end <= start) throw new Error('no object');
      return JSON.parse(s.slice(start, end + 1));
    },
  ];
  for (const run of attempts) {
    try {
      const out = run();
      if (out && typeof out === 'object') return out;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * @param {unknown} parsed
 * @returns {{ centralTopic: object, subtopics: unknown[] } | null}
 */
function coerceMindMapShape(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  let p = /** @type {Record<string, unknown>} */ (parsed);
  const wrapped = p.mindMap ?? p.data ?? p.result ?? p.output;
  if (wrapped && typeof wrapped === 'object') {
    p = /** @type {Record<string, unknown>} */ (wrapped);
  }

  let centralTopic = p.centralTopic ?? p.central_topic ?? p.topic;
  if (typeof centralTopic === 'string') {
    const t = centralTopic.trim();
    centralTopic = {
      id: 'center',
      label: t.length > 120 ? `${t.slice(0, 117)}…` : t,
      description: '',
    };
  }
  let subtopics = p.subtopics ?? p.subTopics ?? p.topics ?? p.branches;
  if (!Array.isArray(subtopics)) subtopics = [];

  if (!centralTopic || typeof centralTopic !== 'object') return null;

  return { centralTopic: /** @type {object} */ (centralTopic), subtopics };
}

/**
 * @param {unknown} data
 * @returns {string}
 */
function extractGroqErrorMessage(data) {
  if (!data || typeof data !== 'object') return '';
  const d = /** @type {Record<string, unknown>} */ (data);
  const err = d.error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof /** @type {{ message?: string }} */ (err).message === 'string') {
    return /** @type {{ message: string }} */ (err).message;
  }
  if (typeof d.message === 'string') return d.message;
  const first = Array.isArray(d.errors) ? d.errors[0] : null;
  if (first && typeof first === 'object' && typeof /** @type {{ message?: string }} */ (first).message === 'string') {
    return /** @type {{ message: string }} */ (first).message;
  }
  return '';
}

/**
 * @param {number} status
 * @param {unknown} data
 * @param {string} rawBody
 */
function httpErrorFromGroq(status, data, rawBody) {
  let base = extractGroqErrorMessage(data);
  if (!base && status === 403) {
    base = 'Access denied (HTTP 403).';
  }
  if (!base) {
    base = `Request failed (${status}).`;
  }

  const isCfBlock =
    status === 403 ||
    /access denied|network settings|forbidden/i.test(base) ||
    /access denied|network settings/i.test(rawBody.slice(0, 500));

  if (isCfBlock) {
    return new Error(
      `${base} Groq’s edge (Cloudflare) often returns this for some IPs—VPNs, company networks, or shared/datacenter addresses. Try another network, turn off VPN, use a phone hotspot, or email support@groq.com with the time of the failure.`
    );
  }

  return new Error(base);
}

/**
 * @param {string} transcript
 * @returns {Promise<Object>}
 */
export async function parseTranscriptToMindMap(transcript) {
  if (!navigator.onLine) {
    throw new Error('You appear to be offline. Connect to the internet and try again.');
  }

  const apiKey = getGroqApiKey();
  const sourceText = clampSourceText(transcript);

  let response;
  try {
    response = await fetch(getGroqChatCompletionsUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_CHAT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Source text:\n\n${sourceText}` },
        ],
        temperature: 0.2,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
      }),
    });
  } catch (e) {
    const isNetwork =
      e instanceof TypeError ||
      (e instanceof Error && /failed to fetch|network|load failed/i.test(e.message));
    if (isNetwork) {
      throw new Error(
        'Could not reach Groq (network or CORS). Use `npm run dev` or `npm run preview` so requests go through the Vite proxy at /api/groq. Static file servers (opening dist/ directly) will not work unless you add a matching proxy.'
      );
    }
    throw e;
  }

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (!response.ok) {
      throw httpErrorFromGroq(response.status, null, raw);
    }
    throw new Error('Invalid response from the model API. Please try again.');
  }

  if (!response.ok) {
    throw httpErrorFromGroq(response.status, data, raw);
  }

  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error(
      'The mind map response was cut off (output too long). Shorten your text in userTranscript.js or simplify the topic, then try again.'
    );
  }

  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('No content returned from the model. Please try again.');
  }

  const parsed = parseAssistantJsonContent(content);
  if (!parsed) {
    throw new Error(
      'Could not parse JSON from the model response. If this keeps happening, try again or shorten your source text.'
    );
  }

  const coerced = coerceMindMapShape(parsed);
  if (!coerced || !coerced.centralTopic || !Array.isArray(coerced.subtopics)) {
    throw new Error('The model returned an unexpected structure. Please try again.');
  }

  return normalizeMindMapData(coerced, sourceText);
}

/**
 * Simple fallback when parsing fails — raw transcript as center, minimal tree.
 * @param {string} transcript
 */
export function createFallbackMindMap(transcript) {
  const label =
    transcript.trim().length > 0
      ? transcript.trim().slice(0, 120) + (transcript.trim().length > 120 ? '…' : '')
      : 'Your text';

  return {
    centralTopic: {
      id: 'center',
      label,
      description:
        transcript.trim().length > 0
          ? transcript.slice(0, 500) + (transcript.length > 500 ? '…' : '')
          : 'We could not structure this automatically. Here is your transcript as the main topic.',
    },
    subtopics: [
      {
        id: 'node-fallback-1',
        label: 'Key point',
        description: 'Automatically generated while structuring your ideas.',
        concepts: [
          {
            id: 'node-fallback-1-1',
            label: 'Detail',
            description:
              transcript.trim().slice(0, 200) || 'Add more text in userTranscript.js to expand your map.',
          },
        ],
      },
      {
        id: 'node-fallback-2',
        label: 'Another angle',
        description: 'Add more source text to refine this branch.',
        concepts: [
          {
            id: 'node-fallback-2-1',
            label: 'Note',
            description: 'Mind Echo will map richer structure from longer text.',
          },
        ],
      },
    ],
  };
}

/**
 * @param {{ centralTopic: object, subtopics: unknown[] }} parsed
 * @param {string} transcript
 */
function normalizeMindMapData(parsed, transcript) {
  const ct = parsed.centralTopic;
  if (!ct.id) ct.id = 'center';
  if (!ct.label) ct.label = 'Main topic';
  if (typeof ct.label === 'string' && ct.label.length > 200) {
    ct.label = ct.label.slice(0, 197) + '…';
  }
  if (!ct.description) ct.description = transcript.slice(0, 300);

  parsed.subtopics = parsed.subtopics.filter((st) => st && typeof st === 'object');

  parsed.subtopics.forEach((st, i) => {
    if (!st.id) st.id = `node-${i + 1}`;
    if (!st.label) st.label = `Subtopic ${i + 1}`;
    if (typeof st.label === 'string' && st.label.length > 180) {
      st.label = st.label.slice(0, 177) + '…';
    }
    if (!st.description) st.description = '';
    if (!Array.isArray(st.concepts)) st.concepts = [];
    st.concepts = st.concepts.filter((c) => c && typeof c === 'object');
    st.concepts.forEach((c, j) => {
      if (!c.id) c.id = `${st.id}-${j + 1}`;
      if (!c.label) c.label = `Concept ${j + 1}`;
      if (typeof c.label === 'string' && c.label.length > 180) {
        c.label = c.label.slice(0, 177) + '…';
      }
      if (!c.description) c.description = '';
    });
  });

  return parsed;
}
