"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Note from "@/components/note";
import { siteConfig } from "@/config/site";
import { api } from "@/convex/_generated/api";
import { generateArticleSchema } from "@/lib/structured-data";
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

  // Update page title and meta tags dynamically
  useEffect(() => {
    if (note && note.title) {
      document.title = `${note.title} | ${siteConfig.title}`;

      // Update meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      const description = note.content
        ? note.content.substring(0, 155)
        : siteConfig.description;
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = description;
        document.head.appendChild(meta);
      }

      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", `${siteConfig.url}/${slug}`);
      } else {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        canonical.setAttribute("href", `${siteConfig.url}/${slug}`);
        document.head.appendChild(canonical);
      }

      // Add structured data
      let structuredData = document.querySelector(
        'script[type="application/ld+json"]'
      );
      if (structuredData) {
        structuredData.textContent = JSON.stringify(
          generateArticleSchema(
            note.title,
            note.content ?? "",
            slug,
            note._creationTime
          )
        );
      } else {
        structuredData = document.createElement("script");
        structuredData.setAttribute("type", "application/ld+json");
        structuredData.textContent = JSON.stringify(
          generateArticleSchema(
            note.title,
            note.content ?? "",
            slug,
            note._creationTime
          )
        );
        document.head.appendChild(structuredData);
      }
    } else if (note) {
      document.title = siteConfig.title;
    }
  }, [note, slug]);

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
