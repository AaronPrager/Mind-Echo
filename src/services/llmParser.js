import { GROQ_BASE, GROQ_CHAT_MODEL, getGroqApiKey } from './groqClient.js';

const CHAT_URL = `${GROQ_BASE}/chat/completions`;

const SYSTEM_PROMPT = `You are an expert at extracting structured knowledge from spoken text and organizing it into mind maps. Given a transcript, identify the single main idea/topic, then identify 3 to 7 major subtopics, and for each subtopic identify 2 to 4 key concepts or facts.

Return ONLY a valid JSON object with this exact schema. No explanation, no markdown, no backticks, only raw JSON.

Return ONLY raw JSON. No markdown, no backticks, no commentary.

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
 * @param {string} transcript
 * @returns {Promise<Object>}
 */
export async function parseTranscriptToMindMap(transcript) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return createFallbackMindMap(transcript);
  }

  if (!navigator.onLine) {
    return createFallbackMindMap(transcript);
  }

  let content;
  try {
    const apiKey = getGroqApiKey();
    const response = await fetch(CHAT_URL, {
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
          { role: 'user', content: `Transcript:\n\n${transcript}` },
        ],
        temperature: 0.2,
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return createFallbackMindMap(transcript);
    }

    if (!response.ok) {
      return createFallbackMindMap(transcript);
    }

    content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return createFallbackMindMap(transcript);
    }
  } catch {
    return createFallbackMindMap(transcript);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return createFallbackMindMap(transcript);
  }

  if (!parsed?.centralTopic || !Array.isArray(parsed.subtopics)) {
    return createFallbackMindMap(transcript);
  }

  return normalizeMindMapData(parsed, transcript);
}

/**
 * Simple fallback when parsing fails — raw transcript as center, minimal tree.
 * @param {string} transcript
 */
export function createFallbackMindMap(transcript) {
  const label =
    transcript.trim().length > 0
      ? transcript.trim().slice(0, 120) + (transcript.trim().length > 120 ? '…' : '')
      : 'Your recording';

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
              transcript.trim().slice(0, 200) || 'Add another recording to expand your map.',
          },
        ],
      },
      {
        id: 'node-fallback-2',
        label: 'Another angle',
        description: 'Use a new recording to refine this branch.',
        concepts: [
          {
            id: 'node-fallback-2-1',
            label: 'Note',
            description: 'Mind Echo will map richer structure on longer speech.',
          },
        ],
      },
    ],
  };
}

function normalizeMindMapData(parsed, transcript) {
  const ct = parsed.centralTopic;
  if (!ct.id) ct.id = 'center';
  if (!ct.label) ct.label = 'Main topic';
  if (!ct.description) ct.description = transcript.slice(0, 300);

  parsed.subtopics.forEach((st, i) => {
    if (!st.id) st.id = `node-${i + 1}`;
    if (!st.label) st.label = `Subtopic ${i + 1}`;
    if (!st.description) st.description = '';
    if (!Array.isArray(st.concepts)) st.concepts = [];
    st.concepts.forEach((c, j) => {
      if (!c.id) c.id = `${st.id}-${j + 1}`;
      if (!c.label) c.label = `Concept ${j + 1}`;
      if (!c.description) c.description = '';
    });
  });

  return parsed;
}
