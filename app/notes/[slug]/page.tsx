import { ConvexHttpClient } from "convex/browser";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { api } from "@/convex/_generated/api";
import { generateArticleSchema } from "@/lib/structured-data";
import NotePageClient from "./note-page-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!convex) {
    return {
      title: siteConfig.title,
      description: siteConfig.description,
    };
  }

  try {
    const note = await convex.query(api.notes.getNoteBySlug, { slug });

    if (!note?.public) {
      return {
        title: siteConfig.title,
        description: siteConfig.description,
      };
    }

    const description = note.content
      ? note.content.substring(0, 155)
      : siteConfig.description;

    const articleSchema = generateArticleSchema(
      note.title ?? siteConfig.title,
      note.content ?? "",
      slug,
      note._creationTime
    );

    return {
      title: note.title
        ? `${siteConfig.title} | ${note.title}`
        : siteConfig.title,
      description,
      alternates: {
        canonical: `${siteConfig.url}/${slug}`,
      },
      openGraph: {
        title: note.title ?? siteConfig.title,
        description,
        url: `${siteConfig.url}/${slug}`,
        type: "article",
        publishedTime: new Date(note._creationTime).toISOString(),
      },
      other: {
        "script:ld+json": JSON.stringify(articleSchema),
      },
    };
  } catch {
    return {
      title: siteConfig.title,
      description: siteConfig.description,
    };
  }
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  return <NotePageClient slug={slug} />;
}
