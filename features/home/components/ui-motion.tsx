"use client";

import { useEffect } from "react";

export function UiMotion() {
  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const progressEl = document.querySelector(".scroll-progress");

    let ticking = false;

    const paintScrollProgress = () => {
      if (!(progressEl instanceof HTMLElement)) {
        ticking = false;
        return;
      }

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const value = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      progressEl.style.transform = `scaleX(${Math.min(Math.max(value, 0), 1)})`;
      ticking = false;
    };

    const queueScrollProgress = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      requestAnimationFrame(paintScrollProgress);
    };

    window.addEventListener("scroll", queueScrollProgress, { passive: true });
    window.addEventListener("resize", queueScrollProgress);
    queueScrollProgress();

    if (!supportsFinePointer || prefersReducedMotion) {
      return () => {
        window.removeEventListener("scroll", queueScrollProgress);
        window.removeEventListener("resize", queueScrollProgress);
      };
    }

    const previewEl = document.querySelector(".preview");
    const experienceItems = Array.from(
      document.querySelectorAll(".experience-item[data-preview]")
    );

    const onExperiencePointerMove = (event: Event) => {
      if (
        !(event instanceof PointerEvent && previewEl instanceof HTMLElement)
      ) {
        return;
      }

      const row = event.currentTarget;
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const src = row.dataset.preview ?? "";
      if (src) {
        previewEl.style.setProperty("--preview-image", `url("${src}")`);
      }

      previewEl.style.setProperty("--px", `${event.clientX + 6}px`);
      previewEl.style.setProperty("--py", `${event.clientY + 6}px`);

      if (!previewEl.classList.contains("is-visible")) {
        previewEl.classList.add("is-visible");
      }
    };

    const onExperiencePointerLeave = () => {
      if (previewEl instanceof HTMLElement) {
        previewEl.classList.remove("is-visible");
      }
    };

    for (const row of experienceItems) {
      row.addEventListener("pointermove", onExperiencePointerMove);
      row.addEventListener("pointerleave", onExperiencePointerLeave);
    }

    return () => {
      window.removeEventListener("scroll", queueScrollProgress);
      window.removeEventListener("resize", queueScrollProgress);
      for (const row of experienceItems) {
        row.removeEventListener("pointermove", onExperiencePointerMove);
        row.removeEventListener("pointerleave", onExperiencePointerLeave);
      }
    };
  }, []);

  return null;
}
