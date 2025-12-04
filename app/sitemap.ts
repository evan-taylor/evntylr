import { ConvexHttpClient } from "convex/browser";
import type { MetadataRoute } from "next";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}
const convex = new ConvexHttpClient(convexUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base sitemap entries
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/notes`,
      lastModified: new Date(),
    },
  ];

  // Try to fetch notes, but don't fail the build if it errors
  let notesUrls: MetadataRoute.Sitemap = [];
  try {
    const notes = await convex.query(api.notes.getPublicNotes);
    notesUrls =
      notes?.map((note) => ({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/${note.slug}`,
        lastModified: new Date(note._creationTime),
      })) ?? [];
  } catch (error) {
    // Log error but continue with base sitemap
    console.error("Failed to fetch notes for sitemap:", error);
  }

  return [...baseUrls, ...notesUrls];
}

// Revalidate the sitemap every hour (ISR)
export const revalidate = 3600;
