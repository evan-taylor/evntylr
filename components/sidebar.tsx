"use client";

import { useMutation } from "convex/react";
import { Pin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { api } from "@/convex/_generated/api";
import { groupNotesByCategory, sortGroupedNotes } from "@/lib/note-utils";
import type { Note } from "@/lib/types";
import { CommandMenu } from "./command-menu";
import { Nav } from "./nav";
import { SearchBar } from "./search";
import SessionId from "./session-id";
import { SidebarContent } from "./sidebar-content";
import { ScrollArea } from "./ui/scroll-area";

const labels: Record<string, React.ReactNode> = {
  pinned: (
    <>
      <Pin className="mr-1 inline-block h-4 w-4" /> Pinned
    </>
  ),
  today: "Today",
  yesterday: "Yesterday",
  "7": "Previous 7 Days",
  "30": "Previous 30 Days",
  older: "Older",
};

const categoryOrder = ["pinned", "today", "yesterday", "7", "30", "older"];

// Navigation keys that should be handled specially during search
const NAV_KEYS = ["j", "ArrowDown", "k", "ArrowUp"];
const DOWN_KEYS = ["j", "ArrowDown"];

// Check if user is in a typing context
function isInTypingContext(target: HTMLElement): boolean {
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.isContentEditable
  );
}

// Handle keyboard events when user is typing
function handleTypingKeyDown(
  event: KeyboardEvent,
  shortcuts: Record<string, () => void>,
  localSearchResults: Note[] | null,
  goToHighlighted: () => void
): boolean {
  if (event.key === "Escape") {
    shortcuts.Escape();
    return true;
  }
  if (
    event.key === "Enter" &&
    localSearchResults &&
    localSearchResults.length > 0
  ) {
    event.preventDefault();
    goToHighlighted();
    return true;
  }
  return true; // Consumed - don't process further
}

// Handle search navigation with arrow keys
function handleSearchNavigation(
  key: string,
  localSearchResults: Note[],
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>
): void {
  const direction = DOWN_KEYS.includes(key) ? 1 : -1;
  setHighlightedIndex(
    (prevIndex) =>
      (prevIndex + direction + localSearchResults.length) %
      localSearchResults.length
  );
}

// Check if search enter should be handled
function shouldHandleSearchEnter(
  key: string,
  localSearchResults: Note[] | null
): boolean {
  return (
    key === "Enter" &&
    localSearchResults !== null &&
    localSearchResults.length > 0
  );
}

// Check if command menu shortcut
function isCommandMenuShortcut(event: KeyboardEvent): boolean {
  return event.key === "k" && (event.metaKey || event.ctrlKey);
}

// Handle shortcut keys (without modifiers)
function handleShortcutKey(
  event: KeyboardEvent,
  shortcuts: Record<string, () => void>,
  localSearchResults: Note[] | null,
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>
): void {
  const key = event.key as keyof typeof shortcuts;
  if (!shortcuts[key] || event.metaKey || event.ctrlKey) {
    return;
  }

  event.preventDefault();
  (document.activeElement as HTMLElement)?.blur();

  // Handle navigation keys during search
  if (localSearchResults && NAV_KEYS.includes(key)) {
    handleSearchNavigation(key, localSearchResults, setHighlightedIndex);
  } else {
    shortcuts[key]();
  }
}

// Compute the next index for navigation
function computeNextIndex(
  direction: "up" | "down",
  currentIndex: number,
  length: number
): number {
  if (direction === "up") {
    return currentIndex > 0 ? currentIndex - 1 : length - 1;
  }
  return currentIndex < length - 1 ? currentIndex + 1 : 0;
}

// Scroll to note after navigation
function scrollToNoteAfterNavigation(slug: string): void {
  setTimeout(() => {
    const selectedElement = document.querySelector(
      `[data-note-slug="${slug}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, 100);
}

export default function Sidebar({
  notes: publicNotes,
  onNoteSelect,
  isMobile,
}: {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  isMobile: boolean;
}) {
  const router = useRouter();
  const deleteNoteMutation = useMutation(api.notes.deleteNote);

  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const [unpinnedPublicNotes, setUnpinnedPublicNotes] = useState<Set<string>>(
    new Set()
  );
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [localSearchResults, setLocalSearchResults] = useState<Note[] | null>(
    null
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [groupedNotes, setGroupedNotes] = useState<Record<string, Note[]>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [openSwipeItemSlug, setOpenSwipeItemSlug] = useState<string | null>(
    null
  );
  const [highlightedNote, setHighlightedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const commandMenuRef = useRef<{ setOpen: (open: boolean) => void } | null>(
    null
  );

  const selectedNoteRef = useRef<HTMLDivElement>(null);

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNoteSlug && scrollViewportRef.current) {
      const selectedElement = scrollViewportRef.current.querySelector(
        `[data-note-slug="${selectedNoteSlug}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedNoteSlug]);

  useEffect(() => {
    if (selectedNoteRef.current) {
      selectedNoteRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  const {
    notes: sessionNotes,
    sessionId,
    setSessionId,
    refreshSessionNotes,
  } = useContext(SessionNotesContext);

  const notes = useMemo(
    () => [...publicNotes, ...sessionNotes],
    [publicNotes, sessionNotes]
  );

  useEffect(() => {
    if (pathname) {
      const slug = pathname.split("/").pop();
      setSelectedNoteSlug(slug ?? null);
    }
  }, [pathname]);

  useEffect(() => {
    if (selectedNoteSlug) {
      const foundNote = notes.find((n) => n.slug === selectedNoteSlug);
      setSelectedNote(foundNote ?? null);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteSlug, notes]);

  useEffect(() => {
    const currentNoteSlugs = new Set(notes.map((note) => note.slug));

    const storedPinnedNotes = localStorage.getItem("pinnedNotes");
    if (storedPinnedNotes) {
      // Filter to only include slugs that still exist
      const filteredPinnedNotes = (
        JSON.parse(storedPinnedNotes) as string[]
      ).filter((slug) => currentNoteSlugs.has(slug));
      setPinnedNotes(new Set(filteredPinnedNotes));
      // Update localStorage to remove stale entries
      localStorage.setItem("pinnedNotes", JSON.stringify(filteredPinnedNotes));
    } else {
      const initialPinnedNotes = new Set(
        notes
          .filter(
            (note) =>
              note.slug === "about-me" ||
              note.slug === "quick-links" ||
              note.sessionId === sessionId
          )
          .map((note) => note.slug)
      );
      setPinnedNotes(initialPinnedNotes);
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(initialPinnedNotes))
      );
    }

    // Load unpinned public notes from localStorage
    const storedUnpinnedPublicNotes = localStorage.getItem(
      "unpinnedPublicNotes"
    );
    if (storedUnpinnedPublicNotes) {
      // Filter to only include slugs that still exist
      const filteredUnpinnedPublicNotes = (
        JSON.parse(storedUnpinnedPublicNotes) as string[]
      ).filter((slug) => currentNoteSlugs.has(slug));
      setUnpinnedPublicNotes(new Set(filteredUnpinnedPublicNotes));
      // Update localStorage to remove stale entries
      localStorage.setItem(
        "unpinnedPublicNotes",
        JSON.stringify(filteredUnpinnedPublicNotes)
      );
    }
  }, [notes, sessionId]);

  useEffect(() => {
    const userSpecificNotes = notes.filter(
      (note) => note.public || note.sessionId === sessionId
    );
    const grouped = groupNotesByCategory(
      userSpecificNotes,
      pinnedNotes,
      unpinnedPublicNotes
    );
    sortGroupedNotes(grouped);
    setGroupedNotes(grouped);
  }, [notes, sessionId, pinnedNotes, unpinnedPublicNotes]);

  useEffect(() => {
    if (localSearchResults && localSearchResults.length > 0) {
      setHighlightedNote(localSearchResults[highlightedIndex]);
    } else {
      setHighlightedNote(selectedNote);
    }
  }, [localSearchResults, highlightedIndex, selectedNote]);

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery("");
    setHighlightedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, []);

  const flattenedNotes = useCallback(
    () =>
      categoryOrder.flatMap((category) =>
        groupedNotes[category] ? groupedNotes[category] : []
      ),
    [groupedNotes]
  );

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      if (localSearchResults) {
        return;
      }

      const flattened = flattenedNotes();
      const currentIndex = flattened.findIndex(
        (note) => note.slug === selectedNoteSlug
      );

      const nextIndex = computeNextIndex(
        direction,
        currentIndex,
        flattened.length
      );
      const nextNote = flattened[nextIndex];

      if (!nextNote) {
        return;
      }

      router.push(`/${nextNote.slug}`);
      scrollToNoteAfterNavigation(nextNote.slug);
    },
    [flattenedNotes, selectedNoteSlug, router, localSearchResults]
  );

  const handlePinToggle = useCallback(
    (slug: string, isCurrentlyPinned: boolean) => {
      const isPinning = !isCurrentlyPinned;
      const note = notes.find((n) => n.slug === slug);

      // If unpinning a public note that has pinned: true, track it as explicitly unpinned
      if (!isPinning && note?.public && note?.pinned === true) {
        setUnpinnedPublicNotes((prev) => {
          const newUnpinned = new Set(prev);
          newUnpinned.add(slug);
          localStorage.setItem(
            "unpinnedPublicNotes",
            JSON.stringify(Array.from(newUnpinned))
          );
          return newUnpinned;
        });
      } else if (isPinning && note?.public && note?.pinned === true) {
        // If re-pinning a public note that has pinned: true, remove from unpinned set
        setUnpinnedPublicNotes((prev) => {
          const newUnpinned = new Set(prev);
          newUnpinned.delete(slug);
          localStorage.setItem(
            "unpinnedPublicNotes",
            JSON.stringify(Array.from(newUnpinned))
          );
          return newUnpinned;
        });
      } else {
        // Regular pin/unpin for non-public or non-admin-pinned notes
        setPinnedNotes((prev) => {
          const newPinned = new Set(prev);
          if (isPinning) {
            newPinned.add(slug);
          } else {
            newPinned.delete(slug);
          }
          localStorage.setItem(
            "pinnedNotes",
            JSON.stringify(Array.from(newPinned))
          );
          return newPinned;
        });
      }

      clearSearch();

      if (!isMobile) {
        router.push(`/${slug}`);
      }

      toast(isPinning ? "Note pinned" : "Note unpinned");
    },
    [router, isMobile, clearSearch, notes]
  );

  const handleNoteDelete = useCallback(
    async (noteToDelete: Note) => {
      if (noteToDelete.public) {
        toast.error("Oops! You can't delete public notes");
        return;
      }

      try {
        if (noteToDelete.slug && sessionId) {
          await deleteNoteMutation({
            slug: noteToDelete.slug,
            sessionId,
          });
        }

        setGroupedNotes((prevGroupedNotes: Record<string, Note[]>) => {
          const newGroupedNotes = { ...prevGroupedNotes };
          for (const category of Object.keys(newGroupedNotes)) {
            newGroupedNotes[category] = newGroupedNotes[category].filter(
              (n: Note) => n.slug !== noteToDelete.slug
            );
          }
          return newGroupedNotes;
        });

        const allNotes = flattenedNotes();
        const deletedNoteIndex = allNotes.findIndex(
          (note) => note.slug === noteToDelete.slug
        );

        let nextNote: Note | undefined;
        if (deletedNoteIndex === 0) {
          nextNote = allNotes[1];
        } else {
          nextNote = allNotes[deletedNoteIndex - 1];
        }

        if (!isMobile) {
          router.push(nextNote ? `/${nextNote.slug}` : "/about-me");
        }

        clearSearch();
        refreshSessionNotes();
        router.refresh();

        toast.success("Note deleted");
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [
      deleteNoteMutation,
      sessionId,
      flattenedNotes,
      isMobile,
      clearSearch,
      refreshSessionNotes,
      router,
    ]
  );

  const goToHighlightedNote = useCallback(() => {
    if (localSearchResults?.[highlightedIndex]) {
      const selectedSearchNote = localSearchResults[highlightedIndex];
      router.push(`/${selectedSearchNote.slug}`);
      setTimeout(() => {
        const selectedElement = document.querySelector(
          `[data-note-slug="${selectedSearchNote.slug}"]`
        );
        selectedElement?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 0);
      clearSearch();
    }
  }, [localSearchResults, highlightedIndex, router, clearSearch]);

  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const shortcuts: Record<string, () => void> = {
      j: () => navigateNotes("down"),
      ArrowDown: () => navigateNotes("down"),
      k: () => navigateNotes("up"),
      ArrowUp: () => navigateNotes("up"),
      p: () => {
        if (!highlightedNote) {
          return;
        }
        // Determine if the note is currently pinned
        const isExplicitlyUnpinned =
          highlightedNote.public &&
          highlightedNote.pinned === true &&
          unpinnedPublicNotes.has(highlightedNote.slug);
        const isCurrentlyPinned =
          !isExplicitlyUnpinned &&
          (highlightedNote.pinned === true ||
            pinnedNotes.has(highlightedNote.slug));
        handlePinToggle(highlightedNote.slug, isCurrentlyPinned);
      },
      d: () => highlightedNote && handleNoteDelete(highlightedNote),
      "/": () => searchInputRef.current?.focus(),
      Escape: () => (document.activeElement as HTMLElement)?.blur(),
      t: () => setTheme(theme === "dark" ? "light" : "dark"),
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Handle typing context separately
      if (isInTypingContext(target)) {
        handleTypingKeyDown(
          event,
          shortcuts,
          localSearchResults,
          goToHighlightedNote
        );
        return;
      }

      // Handle Cmd/Ctrl+K for command menu
      if (isCommandMenuShortcut(event)) {
        event.preventDefault();
        commandMenuRef.current?.setOpen(true);
        return;
      }

      // Handle Enter for search results
      if (shouldHandleSearchEnter(event.key, localSearchResults)) {
        event.preventDefault();
        goToHighlightedNote();
        return;
      }

      // Handle shortcut keys (without modifiers)
      handleShortcutKey(
        event,
        shortcuts,
        localSearchResults,
        setHighlightedIndex
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    navigateNotes,
    highlightedNote,
    handlePinToggle,
    localSearchResults,
    handleNoteDelete,
    goToHighlightedNote,
    setTheme,
    theme,
    pinnedNotes,
    unpinnedPublicNotes,
  ]);

  const handleNoteSelect = useCallback(
    (note: Note) => {
      onNoteSelect(note);
      if (!isMobile) {
        router.push(`/${note.slug}`);
      }
      clearSearch();
    },
    [clearSearch, onNoteSelect, isMobile, router]
  );

  return (
    <div
      className={`${
        isMobile
          ? "w-full max-w-full"
          : "w-[320px] border-muted-foreground/20 border-r"
      } flex h-dvh flex-col dark:bg-muted`}
    >
      <div className={`${isMobile ? "w-full" : "w-[320px]"}`}>
        <Nav
          addNewPinnedNote={handlePinToggle}
          clearSearch={clearSearch}
          isMobile={isMobile}
          isScrolled={isScrolled}
          setSelectedNoteSlug={setSelectedNoteSlug}
        />
      </div>
      <ScrollArea
        className="flex-1"
        isMobile={isMobile}
        onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
          const viewport = e.currentTarget.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
          if (viewport) {
            const scrolled = viewport.scrollTop > 0;
            setIsScrolled(scrolled);
          }
        }}
      >
        <div className="flex w-full flex-col" ref={scrollViewportRef}>
          <SessionId setSessionId={setSessionId} />
          <CommandMenu
            addNewPinnedNote={handlePinToggle}
            deleteNote={handleNoteDelete}
            highlightedNote={highlightedNote}
            isMobile={isMobile}
            navigateNotes={navigateNotes}
            notes={notes}
            pinnedNotes={pinnedNotes}
            sessionId={sessionId}
            setSelectedNoteSlug={setSelectedNoteSlug}
            togglePinned={handlePinToggle}
            unpinnedPublicNotes={unpinnedPublicNotes}
          />
          <div className={`${isMobile ? "w-full" : "w-[320px]"} px-2`}>
            <SearchBar
              clearSearch={clearSearch}
              inputRef={searchInputRef}
              notes={notes}
              onSearchResults={setLocalSearchResults}
              searchQuery={searchQuery}
              sessionId={sessionId}
              setHighlightedIndex={setHighlightedIndex}
              setSearchQuery={setSearchQuery}
            />
            <SidebarContent
              categoryOrder={categoryOrder}
              clearSearch={clearSearch}
              groupedNotes={groupedNotes}
              handleNoteDelete={handleNoteDelete}
              handlePinToggle={handlePinToggle}
              highlightedIndex={highlightedIndex}
              labels={labels}
              localSearchResults={localSearchResults}
              onNoteSelect={handleNoteSelect}
              openSwipeItemSlug={openSwipeItemSlug}
              pinnedNotes={pinnedNotes}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              setSelectedNoteSlug={setSelectedNoteSlug}
              unpinnedPublicNotes={unpinnedPublicNotes}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
