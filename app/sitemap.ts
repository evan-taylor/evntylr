import { ConvexHttpClient } from "convex/browser";
import type { MetadataRoute } from "next";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}
const convex = new ConvexHttpClient(convexUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notes = await convex.query(api.notes.getPublicNotes);

  const notesUrls =
    notes?.map((note) => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${note.slug}`,
      lastModified: new Date(note._creationTime),
    })) ?? [];

  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/notes`,
      lastModified: new Date(),
    },
    ...notesUrls,
  ];
}

// Revalidate the sitemap every hour
export const revalidate = 3600;
