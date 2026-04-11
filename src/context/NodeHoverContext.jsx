import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/** @typedef {{ id: string, label: string, description: string } | null} HoveredNode */

const NodeHoverContext = createContext(
  /** @type {{
   *   hovered: HoveredNode,
   *   setHovered: (h: HoveredNode) => void,
   *   scheduleClearHover: () => void,
   * }} */ (null)
);

export function NodeHoverProvider({ children }) {
  const [hovered, setHoveredState] = useState(/** @type {HoveredNode} */ (null));
  const clearTimerRef = useRef(null);

  const setHovered = useCallback((h) => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setHoveredState(h);
  }, []);

  /** Call from node onMouseLeave so moving between nodes does not flash idle. */
  const scheduleClearHover = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setHoveredState(null);
      clearTimerRef.current = null;
    }, 90);
  }, []);

  const value = useMemo(
    () => ({ hovered, setHovered, scheduleClearHover }),
    [hovered, setHovered, scheduleClearHover]
  );

  return <NodeHoverContext.Provider value={value}>{children}</NodeHoverContext.Provider>;
}

export function useNodeHover() {
  const ctx = useContext(NodeHoverContext);
  if (!ctx) {
    throw new Error('useNodeHover must be used within NodeHoverProvider');
  }
  return ctx;
}
