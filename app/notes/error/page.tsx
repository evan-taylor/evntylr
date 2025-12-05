import type { Metadata } from "next";
import ErrorPageClient from "./error-page-client";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ErrorPage() {
  return <ErrorPageClient />;
}
