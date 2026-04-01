const DEFAULT_SITE_URL = "https://evntylr.com";

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const siteConfig = {
  name: "Evan Taylor",
  title: "Evan Taylor | Software Developer",
  description:
    "Personal website of Evan Taylor, a Computer Science student at Cal Poly building polished software with React, Python, and Java.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL),
  locale: "en_US",
};
