import { useCallback } from 'react';
import { transcribeAudio } from '../services/whisper';
import { parseTranscriptToMindMap } from '../services/llmParser';

const MIN_BYTES = 1024;

/**
 * @param {(stage: 1 | 2 | 3) => void} [onStage]
 */
async function buildMindMapFromAudio(audioBlob, onStage) {
  if (!audioBlob || audioBlob.size < MIN_BYTES) {
    throw new Error('Recording is too short. Speak a bit longer, then try again.');
  }

  onStage?.(1);
  const transcript = await transcribeAudio(audioBlob);

  onStage?.(2);
  const mapData = await parseTranscriptToMindMap(transcript);

  onStage?.(3);
  await new Promise((r) => setTimeout(r, 450));

  return mapData;
}

/**
 * @returns {{ processAudio: typeof buildMindMapFromAudio }}
 */
export function useMindMapData() {
  const processAudio = useCallback((audioBlob, onStage) => buildMindMapFromAudio(audioBlob, onStage), []);
  return { processAudio };
}
