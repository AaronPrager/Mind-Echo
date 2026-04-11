import { useEffect, useRef, useState } from 'react';

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Rapid "typing" and "deleting" when `targetText` or `animationKey` changes.
 * @param {string | undefined | null} targetText
 * @param {string | number} animationKey — e.g. node id so switching nodes re-runs animation
 * @returns {string}
 */
export function useRapidTypewriter(targetText, animationKey) {
  const [display, setDisplay] = useState('');
  const displayRef = useRef('');
  displayRef.current = display;
  const timersRef = useRef([]);

  useEffect(() => {
    const goal = targetText ?? '';
    const timers = timersRef.current;
    timers.forEach(clearTimeout);
    timers.length = 0;

    let cancelled = false;
    let buffer = displayRef.current;

    const push = (id) => {
      timers.push(id);
    };

    const eraseStep = () => {
      if (cancelled) return;
      if (buffer.length === 0) {
        typeStep();
        return;
      }
      const step = Math.min(buffer.length, randInt(1, 3));
      buffer = buffer.slice(0, buffer.length - step);
      setDisplay(buffer);
      push(setTimeout(eraseStep, randInt(10, 18)));
    };

    const typeStep = () => {
      if (cancelled) return;
      if (buffer.length >= goal.length) {
        if (buffer !== goal) {
          buffer = goal;
          setDisplay(goal);
        }
        return;
      }
      const nextLen = Math.min(goal.length, buffer.length + randInt(1, 2));
      buffer = goal.slice(0, nextLen);
      setDisplay(buffer);
      push(setTimeout(typeStep, randInt(8, 20)));
    };

    push(setTimeout(eraseStep, 0));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, [targetText, animationKey]);

  return display;
}
