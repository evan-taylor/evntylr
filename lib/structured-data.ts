import { siteConfig } from "@/config/site";

export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.title,
    url: siteConfig.url,
    sameAs: ["https://twitter.com/evntylr"],
    jobTitle: "Software Engineer",
    description: siteConfig.description,
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Website",
    name: siteConfig.title,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      "@type": "Person",
      name: siteConfig.title,
    },
  };
}

export function generateArticleSchema(
  title: string,
  content: string,
  slug: string,
  createdAt: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    articleBody: content.substring(0, 200), // First 200 chars
    url: `${siteConfig.url}/${slug}`,
    datePublished: new Date(createdAt).toISOString(),
    dateModified: new Date(createdAt).toISOString(),
    author: {
      "@type": "Person",
      name: siteConfig.title,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.title,
    },
  };
}
