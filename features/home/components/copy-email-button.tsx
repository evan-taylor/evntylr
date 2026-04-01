"use client";

import { useEffect, useRef, useState } from "react";

const RESET_DELAY_MS = 1800;

type CopyEmailButtonProps = {
  email: string;
  label: string;
  variant: "inline" | "row";
  details?: string;
};

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

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2.75A1.25 1.25 0 0 1 7.25 1.5h5A1.25 1.25 0 0 1 13.5 2.75v5A1.25 1.25 0 0 1 12.25 9h-5A1.25 1.25 0 0 1 6 7.75z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.75 5H4A1.5 1.5 0 0 0 2.5 6.5V12A1.5 1.5 0 0 0 4 13.5h5.5A1.5 1.5 0 0 0 11 12v-.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.4 6.3 11.2 12.5 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyEmailButton({
  email,
  label,
  variant,
  details,
}: CopyEmailButtonProps) {
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

  const buttonClassName =
    variant === "row"
      ? `item-link copy-email-button copy-email-button--row${copied ? " is-copied" : ""}`
      : `soft-link copy-email-button copy-email-button--inline${copied ? " is-copied" : ""}`;

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={handleCopy}
      aria-label={copied ? `Copied ${email}` : `Copy email address ${email}`}
    >
      {variant === "row" ? (
        <>
          <span className="copy-email-button__label-wrap">
            <span className="item-label">{label}</span>
            <span className="copy-email-button__status" aria-hidden="true">
              <span className="copy-email-button__icon copy-email-button__icon--copy">
                <CopyIcon />
              </span>
              <span className="copy-email-button__icon copy-email-button__icon--check">
                <CheckIcon />
              </span>
            </span>
          </span>
          <span className="item-description">{details}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <span className="copy-email-button__status" aria-hidden="true">
            <span className="copy-email-button__icon copy-email-button__icon--copy">
              <CopyIcon />
            </span>
            <span className="copy-email-button__icon copy-email-button__icon--check">
              <CheckIcon />
            </span>
          </span>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied to clipboard." : ""}
      </span>
    </button>
  );
}
