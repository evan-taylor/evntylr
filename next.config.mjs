/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Serve public notes at root level (e.g., /about-me -> /notes/about-me internally)
      {
        source:
          "/:slug((?!notes|api|_next|static|public|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
        destination: "/notes/:slug",
      },
    ];
  },
  async redirects() {
    return [
      // Redirect root to notes list (will then auto-redirect to first pinned note)
      {
        source: "/",
        destination: "/notes",
        permanent: false,
      },
      // Redirect old /notes/[slug] URLs to new root-level URLs
      // (except for special routes like manage-notes, error, api, revalidate)
      {
        source: "/notes/:slug((?!manage-notes|error|api|revalidate).*)",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
