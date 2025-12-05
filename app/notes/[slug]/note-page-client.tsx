"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Note from "@/components/note";
import { api } from "@/convex/_generated/api";
import type { Note as NoteType } from "@/lib/types";

export default function NotePageClient({ slug }: { slug: string }) {
  const router = useRouter();

  const note = useQuery(api.notes.getNoteBySlug, { slug }) as
    | NoteType
    | null
    | undefined;

  useEffect(() => {
    if (note === null) {
      router.push("/notes/error");
    }
  }, [note, router]);

  if (note === undefined) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center p-3">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (note === null) {
    return null;
  }

  return (
    <div
      className="fade-in slide-in-from-right-2 min-h-dvh w-full animate-in p-3 duration-200"
      key={slug}
    >
      <Note note={note} />
    </div>
  );
}
