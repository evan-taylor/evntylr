"use client";

import { useQuery } from "convex/react";
import { createContext, useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Note } from "@/lib/types";

export type SessionNotes = {
  sessionId: string;
  notes: Note[];
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
};

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {
    // Default no-op, will be overridden by provider
  },
  refreshSessionNotes: async () => {
    // Default no-op, will be overridden by provider
  },
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionId, setSessionId] = useState<string>("");

  // Use Convex reactive query for session notes
  const sessionNotes = useQuery(
    api.notes.getSessionNotes,
    sessionId ? { sessionId } : "skip"
  );

  // refreshSessionNotes is now a no-op since Convex handles real-time updates
  const refreshSessionNotes = useCallback(async () => {
    // Convex queries are reactive and update automatically
    // This function is kept for API compatibility
  }, []);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes: (sessionNotes as Note[]) ?? [],
        setSessionId,
        refreshSessionNotes,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
