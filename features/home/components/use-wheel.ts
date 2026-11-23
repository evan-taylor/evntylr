"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TURN_DEGREES = 26;
const SHRINK_PER_STEP = 0.07;
const FADE_PER_STEP = 0.34;
const MIN_OPACITY = 0.12;
const MAX_STEPS = 3;
const ITEM_SELECTOR = "[data-wheel-item]";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const centerOffset = (wheel: HTMLElement, row: HTMLElement) =>
  row.offsetTop + row.offsetHeight / 2 - wheel.clientHeight / 2;

// A flat cylinder: rows fade and get shorter as they turn away from the centre.
const paintRow = (row: HTMLElement, steps: number, reduced: boolean) => {
  const distance = Math.min(Math.abs(steps), MAX_STEPS);
  row.style.opacity = String(
    Math.max(1 - distance * FADE_PER_STEP, MIN_OPACITY)
  );
  if (reduced) {
    return;
  }
  const scale = 1 - distance * SHRINK_PER_STEP;
  const turn = Math.cos((distance * TURN_DEGREES * Math.PI) / 180);
  row.style.transform = `scale(${scale}, ${scale * turn})`;
};

/**
 * A snap-scrolling picker wheel. Every `[data-wheel-item]` inside the returned
 * ref is repainted on each scroll frame, so the motion is always exactly as far
 * along as the scroll is. `initialIndex` is read once, on mount.
 */
export function useWheel(initialIndex: () => number) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const initial = useRef(initialIndex);

  const scrollToIndex = useCallback((index: number, smooth: boolean) => {
    const wheel = ref.current;
    const row = wheel?.querySelectorAll<HTMLElement>(ITEM_SELECTOR)[index];
    if (!(wheel && row)) {
      return;
    }
    wheel.scrollTo({
      top: centerOffset(wheel, row),
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    const wheel = ref.current;
    if (!wheel) {
      return;
    }
    const rows = Array.from(wheel.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    const reduced = prefersReducedMotion();
    let frame = 0;
    let current = 0;

    const nearest = () => {
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const [index, row] of rows.entries()) {
        const distance = Math.abs(centerOffset(wheel, row) - wheel.scrollTop);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
      return best;
    };

    const render = () => {
      frame = 0;
      for (const row of rows) {
        const steps =
          (centerOffset(wheel, row) - wheel.scrollTop) / row.offsetHeight;
        paintRow(row, steps, reduced);
      }
      const index = nearest();
      if (index !== current) {
        current = index;
        setActive(index);
      }
    };
    const queue = () => {
      if (!frame) {
        frame = requestAnimationFrame(render);
      }
    };

    // Arrow keys step one row at a time, with no glide.
    const onKeyDown = (event: KeyboardEvent) => {
      const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
      const row = step ? rows[nearest() + step] : undefined;
      if (!row) {
        return;
      }
      event.preventDefault();
      wheel.scrollTo({ top: centerOffset(wheel, row), behavior: "instant" });
    };

    const start = rows[initial.current()];
    if (start) {
      wheel.scrollTo({ top: centerOffset(wheel, start), behavior: "instant" });
    }
    render();
    wheel.addEventListener("keydown", onKeyDown);
    wheel.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      wheel.removeEventListener("keydown", onKeyDown);
      wheel.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  return { ref, active, scrollToIndex };
}
