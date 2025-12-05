"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

const emoji = "🤔";
const title = "Oops! This page doesn't exist";
const message = "Please select or create another note";

export default function ErrorPageClient() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      posthog.capture("note_not_found", {
        url: window.location.href,
      });
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">{emoji}</div>
        <h3 className="mb-2 font-bold text-xl">{title}</h3>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
