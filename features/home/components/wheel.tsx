"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useWheel } from "./use-wheel";

export interface WheelSection {
  id: string;
  label: string;
  /** Full name for assistive tech when the label is shortened. */
  name: string;
  panel: ReactNode;
}

export function Wheel({ sections }: { sections: WheelSection[] }) {
  // A link like /#hovn opens with that section already under the centre.
  const { ref, active, scrollToIndex } = useWheel(() =>
    Math.max(
      sections.findIndex(
        (section) => section.id === window.location.hash.slice(1)
      ),
      0
    )
  );
  const hasSpun = useRef(false);
  const activeId = sections[active]?.id;

  // Keep the address in step with the wheel so any section can be shared.
  useEffect(() => {
    if (!(hasSpun.current && activeId)) {
      hasSpun.current = true;
      return;
    }
    const { pathname, search } = window.location;
    const hash = activeId === sections[0]?.id ? "" : `#${activeId}`;
    window.history.replaceState(null, "", `${pathname}${search}${hash}`);
  }, [activeId, sections]);

  // Follow the address when it changes under us, such as an edited hash.
  useEffect(() => {
    const onHashChange = () => {
      const index = sections.findIndex(
        (section) => section.id === window.location.hash.slice(1)
      );
      scrollToIndex(Math.max(index, 0), false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [scrollToIndex, sections]);

  return (
    <div className="wheel-layout">
      <nav aria-label="Sections" className="wheel-frame">
        <div className="wheel" ref={ref}>
          {sections.map((section, index) => (
            <button
              aria-current={index === active ? "true" : undefined}
              aria-label={section.name}
              className="wheel-item"
              data-wheel-item
              key={section.id}
              onClick={() => scrollToIndex(index, true)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="panels">
        {sections.map((section, index) => (
          <section
            aria-label={section.name}
            className="panel"
            hidden={index !== active}
            key={section.id}
          >
            {section.panel}
          </section>
        ))}
      </div>
    </div>
  );
}
