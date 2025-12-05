"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { SessionNotesProvider } from "@/app/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Note } from "@/lib/types";
import { useMobileDetect } from "./mobile-detector";
import Sidebar from "./sidebar";

type SidebarLayoutProps = {
  children: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const isMobile = useMobileDetect();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch public notes using Convex
  const publicNotes = useQuery(api.notes.getPublicNotes) as Note[] | undefined;

  useEffect(() => {
    if (
      isMobile !== null &&
      !isMobile &&
      pathname === "/notes" &&
      publicNotes
    ) {
      // Find the first pinned note, or fall back to the first public note
      const firstNote =
        publicNotes.find((note) => note.pinned) || publicNotes[0];
      if (firstNote) {
        router.push(`/${firstNote.slug}`);
      }
    }
  }, [isMobile, router, pathname, publicNotes]);

  if (isMobile === null) {
    return null;
  }

  const showSidebar = !isMobile || pathname === "/notes";

  return (
    <SessionNotesProvider>
      <div className="flex h-dvh bg-white text-black dark:bg-[#1E1E1E] dark:text-white">
        {showSidebar === true && (
          <Sidebar isMobile={isMobile} notes={publicNotes ?? []} />
        )}
        {!(isMobile === true && showSidebar === true) && (
          <div className="h-dvh flex-grow bg-white dark:bg-[#1E1E1E]">
            <ScrollArea className="h-full" isMobile={isMobile}>
              {children}
            </ScrollArea>
          </div>
        )}
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
