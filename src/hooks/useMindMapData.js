import { useCallback } from 'react';
import { parseTranscriptToMindMap } from '../services/llmParser';

const MIN_CHARS = 10;

/**
 * @param {(stage: 1 | 2 | 3) => void} [onStage]
 */
async function buildMindMapFromText(text, onStage) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length < MIN_CHARS) {
    throw new Error('Add more text in src/userTranscript.js (at least a sentence or two).');
  }

  onStage?.(1);
  await new Promise((r) => setTimeout(r, 200));

  onStage?.(2);
  const mapData = await parseTranscriptToMindMap(trimmed);

  onStage?.(3);
  await new Promise((r) => setTimeout(r, 450));

  return mapData;
}

/**
 * @returns {{ processText: typeof buildMindMapFromText }}
 */
export function useMindMapData() {
  const processText = useCallback((text, onStage) => buildMindMapFromText(text, onStage), []);
  return { processText };
}
