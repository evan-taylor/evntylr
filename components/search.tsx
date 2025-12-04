import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
} from "react";
import type { Note } from "@/lib/types";
import { Icons } from "./icons";

type SearchBarProps = {
  notes: Note[];
  onSearchResults: (results: Note[] | null) => void;
  sessionId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  clearSearch: () => void;
};

export function SearchBar({
  notes,
  onSearchResults,
  sessionId,
  inputRef,
  searchQuery,
  setSearchQuery,
  setHighlightedIndex,
  clearSearch,
}: SearchBarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle second Escape press to clear search
      if (
        e.key === "Escape" &&
        document.activeElement !== inputRef.current &&
        searchQuery
      ) {
        clearSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inputRef, searchQuery, clearSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      clearSearch();
      return;
    }

    const filteredNotes = notes.filter(
      (note) =>
        (note.public || note.sessionId === sessionId) &&
        ((note.title ?? "")
          .toLowerCase()
          .includes(query.trim().toLowerCase()) ||
          (note.content ?? "")
            .toLowerCase()
            .includes(query.trim().toLowerCase()))
    );

    onSearchResults(filteredNotes);
    setHighlightedIndex(0);
  };

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icons.search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          aria-label="Search notes"
          autoComplete="off"
          className="liquid-transition w-full rounded-lg bg-black/5 py-1.5 pr-9 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 dark:bg-[#323232]"
          id="search"
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search"
          ref={inputRef}
          type="text"
          value={searchQuery}
        />
        {searchQuery !== "" && (
          <button
            aria-label="Clear search"
            className="-translate-y-1/2 liquid-transition absolute top-1/2 right-3 transform rounded-full p-1 text-muted-foreground hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
            onClick={clearSearch}
            type="button"
          >
            <Icons.close className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
