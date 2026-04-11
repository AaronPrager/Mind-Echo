/**
 * @typedef {{ id: string, label: string, description: string }} Concept
 * @typedef {{
 *   id: string,
 *   label: string,
 *   description: string,
 *   concepts: Concept[]
 * }} Subtopic
 * @typedef {{
 *   centralTopic: { id: string, label: string, description: string },
 *   subtopics: Subtopic[]
 * }} MindMapData
 */

const CENTER_R = 300;
const CONCEPT_R = 180;

/**
 * @param {MindMapData} mapData
 * @returns {{ nodes: import('reactflow').Node[], edges: import('reactflow').Edge[] }}
 */
export function computeLayout(mapData) {
  const { centralTopic, subtopics: rawSubs } = mapData;
  const subtopics = Array.isArray(rawSubs) ? rawSubs : [];
  const nodes = [];
  const edges = [];
  let animationIndex = 0;

  nodes.push({
    id: centralTopic.id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      label: centralTopic.label,
      description: centralTopic.description,
      nodeType: 'center',
      animationIndex: animationIndex++,
    },
  });

  if (subtopics.length === 0) {
    return { nodes, edges };
  }

  const n = subtopics.length;

  subtopics.forEach((st, i) => {
    const angle = (i / n) * 2 * Math.PI;
    const sx = Math.cos(angle) * CENTER_R;
    const sy = Math.sin(angle) * CENTER_R;

    nodes.push({
      id: st.id,
      type: 'custom',
      position: { x: sx, y: sy },
      data: {
        label: st.label,
        description: st.description,
        nodeType: 'subtopic',
        animationIndex: animationIndex++,
      },
    });

    edges.push({
      id: `e-${centralTopic.id}-${st.id}`,
      source: centralTopic.id,
      target: st.id,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: 'rgba(255,255,255,0.35)',
        strokeWidth: 2,
      },
    });

    const concepts = st.concepts || [];
    const m = concepts.length;
    const spread = (30 * Math.PI) / 180;

    if (m === 0) return;

    concepts.forEach((c, j) => {
      const t = m === 1 ? 0 : (j / (m - 1)) * 2 - 1;
      const conceptAngle = angle + t * spread;
      const cx = sx + Math.cos(conceptAngle) * CONCEPT_R;
      const cy = sy + Math.sin(conceptAngle) * CONCEPT_R;

      nodes.push({
        id: c.id,
        type: 'custom',
        position: { x: cx, y: cy },
        data: {
          label: c.label,
          description: c.description,
          nodeType: 'concept',
          animationIndex: animationIndex++,
        },
      });

      edges.push({
        id: `e-${st.id}-${c.id}`,
        source: st.id,
        target: c.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: 'rgba(255,255,255,0.2)',
          strokeWidth: 1.5,
        },
      });
    });
  });

  return { nodes, edges };
}
