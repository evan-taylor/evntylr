import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import SidebarLayout from "@/components/sidebar-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.title,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{siteConfig.title}</title>
        <meta content="summary_large_image" property="twitter:card" />
        <meta content={siteConfig.title} property="twitter:title" />
        <meta content={siteConfig.title} property="twitter:description" />
        <meta content={siteConfig.title} property="og:site_name" />
        <meta content={siteConfig.title} property="og:description" />
        <meta content={siteConfig.title} property="og:title" />
        <meta content={siteConfig.url} property="og:url" />
      </head>
      <body
        className={cn("min-h-dvh font-sans antialiased", fontSans.variable)}
      >
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <SidebarLayout>
              <Analytics />
              {children}
            </SidebarLayout>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
