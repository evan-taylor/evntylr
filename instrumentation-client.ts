import { configure } from "onedollarstats";
import posthog from "posthog-js";

// Initialize PostHog
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (!posthogKey) {
  throw new Error("NEXT_PUBLIC_POSTHOG_KEY is not set");
}

posthog.init(posthogKey, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2025-05-24",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});

// Initialize onedollarstats
configure({
  // Track events on localhost for local development
  trackLocalhostAs: "entylr.com",
});
