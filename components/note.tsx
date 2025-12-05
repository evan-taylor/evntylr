"use client";

import { useMutation } from "convex/react";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Note as NoteType } from "@/lib/types";
import NoteContent from "./note-content";
import NoteHeader from "./note-header";
import SessionId from "./session-id";

export default function Note({ note: initialNote }: { note: NoteType }) {
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<NoteType>>({});
  const noteRef = useRef(initialNote);

  // Convex mutations
  const updateNoteMutation = useMutation(api.notes.updateNote);

  // Cleanup timeout on unmount to prevent updates after component is gone
  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    },
    []
  );

  const saveNote = useCallback(
    (updates: Partial<NoteType>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Update local state immediately (optimistic update)
      setNote((prevNote: NoteType) => {
        const updatedNote = { ...prevNote, ...updates };
        noteRef.current = updatedNote;
        return updatedNote;
      });

      // Accumulate all pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Set new timeout to batch save all pending updates
      saveTimeoutRef.current = setTimeout(() => {
        if (
          noteRef.current.slug &&
          sessionId &&
          Object.keys(pendingUpdatesRef.current).length > 0
        ) {
          const updatesToSave = pendingUpdatesRef.current;
          const currentNote = noteRef.current;

          // Clear pending updates before making calls
          pendingUpdatesRef.current = {};

          // Use single mutation to update all fields
          // Convex queries are reactive and will auto-update, no manual refresh needed
          updateNoteMutation({
            slug: currentNote.slug,
            sessionId,
            title: updatesToSave.title,
            emoji: updatesToSave.emoji,
            content: updatesToSave.content,
          })
            .then(() => {
              // Track note update event
              posthog.capture("note_updated", {
                note_slug: currentNote.slug,
                updated_fields: Object.keys(updatesToSave),
              });
            })
            .catch((error) => {
              posthog.captureException(error as Error);
            });
        }
      }, 500);
    },
    [sessionId, updateNoteMutation]
  );

  const canEdit = sessionId === note.sessionId;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader canEdit={canEdit} note={note} saveNote={saveNote} />
      <NoteContent canEdit={canEdit} note={note} saveNote={saveNote} />
    </div>
  );
}
