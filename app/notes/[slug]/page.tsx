"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Note from "@/components/note";
import { api } from "@/convex/_generated/api";
import type { Note as NoteType } from "@/lib/types";

const SLUG_REGEX = /^notes\//;

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params.slug as string;
  const slug = rawSlug.replace(SLUG_REGEX, "");

  const note = useQuery(api.notes.getNoteBySlug, { slug }) as
    | NoteType
    | null
    | undefined;

  useEffect(() => {
    if (note === null) {
      router.push("/notes/error");
    }
  }, [note, router]);

  // Loading state
  if (note === undefined) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center p-3">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not found (redirect handled by useEffect)
  if (note === null) {
    return null;
  }

  return (
    <div className="min-h-dvh w-full p-3">
      <Note note={note} />
    </div>
  );
}
