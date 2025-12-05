"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

type SessionIdProps = {
  setSessionId: (id: string) => void;
};

export default function SessionId({ setSessionId }: SessionIdProps) {
  const hasIdentified = useRef(false);

  useEffect(() => {
    const currentSessionId = localStorage.getItem("session_id") || uuidv4();
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }
    setSessionId(currentSessionId);

    // Identify user in PostHog using session ID (only once)
    if (!hasIdentified.current) {
      hasIdentified.current = true;
      posthog.identify(currentSessionId, {
        session_id: currentSessionId,
      });
    }
  }, [setSessionId]);

  return null;
}
