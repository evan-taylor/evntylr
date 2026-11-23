"use client";

import { useEffect, useRef, useState } from "react";

const RESET_DELAY_MS = 1500;

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to a legacy copy path for environments
      // where the Clipboard API is unavailable or blocked.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textArea);

  return didCopy;
}

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const didCopy = await copyText(email);

    if (!didCopy) {
      window.location.href = `mailto:${email}`;
      return;
    }

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    setCopied(true);
    resetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimeoutRef.current = null;
    }, RESET_DELAY_MS);
  };

  return (
    <button
      aria-label={`Copy email address ${email}`}
      className="contact-row"
      onClick={handleCopy}
      type="button"
    >
      <span>Email</span>
      <span aria-live="polite">{copied ? "Copied" : email}</span>
    </button>
  );
}
