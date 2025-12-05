"use client";

import { useEffect } from "react";

export function AnalyticsProvider() {
  useEffect(() => {
    // Import and initialize analytics on client side
    import("@/instrumentation-client");
  }, []);

  return null;
}
