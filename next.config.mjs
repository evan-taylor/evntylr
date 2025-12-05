/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // PostHog reverse proxy
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      // Serve public notes at root level (e.g., /about-me -> /notes/about-me internally)
      {
        source:
          "/:slug((?!notes|api|_next|static|public|favicon\\.ico|sitemap\\.xml|robots\\.txt|ingest).*)",
        destination: "/notes/:slug",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
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
