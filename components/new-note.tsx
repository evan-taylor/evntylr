"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { api } from "@/convex/_generated/api";
import { createNote } from "@/lib/create-note";
import { Icons } from "./icons";
import SessionId from "./session-id";

export default function NewNote({
  addNewPinnedNote,
  clearSearch,
  isMobile,
}: {
  addNewPinnedNote: (slug: string, isCurrentlyPinned: boolean) => void;
  clearSearch: () => void;
  isMobile: boolean;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const createNoteMutation = useMutation(api.notes.createNote);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const handleCreateNote = useCallback(() => {
    clearSearch();
    createNote({
      sessionId,
      router,
      addNewPinnedNote,
      refreshSessionNotes,
      isMobile,
      createNoteMutation,
    });
  }, [
    sessionId,
    router,
    addNewPinnedNote,
    clearSearch,
    refreshSessionNotes,
    isMobile,
    createNoteMutation,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (event.key === "n" && !event.metaKey && !isTyping) {
        event.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateNote]);

  return (
    <div className="flex flex-col items-center justify-center">
      <SessionId setSessionId={setSessionId} />
      <button
        aria-label="Create new note"
        className="liquid-transition flex h-9 w-9 items-center justify-center rounded-full border border-muted-foreground/30 bg-transparent text-muted-foreground shadow-sm hover:border-muted-foreground/50 hover:bg-muted-foreground/5 hover:text-foreground dark:border-muted-foreground/20 dark:hover:border-muted-foreground/40 dark:hover:bg-white/5"
        onClick={handleCreateNote}
        type="button"
      >
        <Icons.new />
      </button>
    </div>
  );
}
