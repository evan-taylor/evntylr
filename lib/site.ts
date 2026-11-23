const DEFAULT_SITE_URL = "https://evntylr.com";

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const siteConfig = {
  name: "Evan Taylor",
  title: "Evan Taylor | Software Developer",
  description:
    "Evan Taylor is a software developer and computer science student at Cal Poly. Founder of Soljio and software development intern at Hovn.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL),
  locale: "en_US",
};
