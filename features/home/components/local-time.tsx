"use client";

import { useEffect, useState } from "react";

const TICK_MS = 15_000;

/** The current time in a fixed time zone. Empty until mounted, so server and client always agree. */
export function LocalTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
    const update = () => setTime(format.format(new Date()).toLowerCase());
    update();
    const id = setInterval(update, TICK_MS);
    return () => clearInterval(id);
  }, [timeZone]);

  return <span className="local-time">{time ?? " "}</span>;
}
