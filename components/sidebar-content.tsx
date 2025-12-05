import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Note } from "@/lib/types";
import { NoteItem } from "./note-item";

type SidebarContentProps = {
  groupedNotes: Record<string, Note[]>;
  selectedNoteSlug: string | null;
  sessionId: string;
  handlePinToggle: (slug: string, isCurrentlyPinned: boolean) => void;
  pinnedNotes: Set<string>;
  unpinnedPublicNotes: Set<string>;
  localSearchResults: Note[] | null;
  highlightedIndex: number;
  categoryOrder: string[];
  labels: Record<string, React.ReactNode>;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: React.Dispatch<React.SetStateAction<string | null>>;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
};

export function SidebarContent({
  groupedNotes,
  selectedNoteSlug,
  sessionId,
  handlePinToggle,
  pinnedNotes,
  unpinnedPublicNotes,
  localSearchResults,
  highlightedIndex,
  categoryOrder,
  labels,
  handleNoteDelete,
  openSwipeItemSlug,
  setOpenSwipeItemSlug,
  clearSearch,
  setSelectedNoteSlug,
}: SidebarContentProps) {
  const router = useRouter();

  const isNotePinned = useCallback(
    (note: Note) => {
      const isExplicitlyUnpinned =
        note.public &&
        note.pinned === true &&
        unpinnedPublicNotes.has(note.slug);
      return (
        !isExplicitlyUnpinned &&
        (note.pinned === true || pinnedNotes.has(note.slug))
      );
    },
    [pinnedNotes, unpinnedPublicNotes]
  );

  const handlePinToggleWithClear = useCallback(
    (slug: string, isCurrentlyPinned: boolean) => {
      clearSearch();
      handlePinToggle(slug, isCurrentlyPinned);
    },
    [clearSearch, handlePinToggle]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      clearSearch();
      router.push(`/${slug}`);
      setSelectedNoteSlug(slug);
    },
    [clearSearch, router, setSelectedNoteSlug]
  );

  const handleDelete = useCallback(
    async (note: Note) => {
      clearSearch();
      await handleNoteDelete(note);
    },
    [clearSearch, handleNoteDelete]
  );

  const renderCategoryList = () => (
    <nav className="px-2">
      {categoryOrder.map((categoryKey) => {
        const categoryNotes = groupedNotes[categoryKey];
        if (!categoryNotes || categoryNotes.length === 0) {
          return null;
        }
        return (
          <section key={categoryKey}>
            <h3 className="mt-4 mb-1 ml-4 font-bold text-muted-foreground text-sm tracking-tight">
              {labels[categoryKey as keyof typeof labels]}
            </h3>
            <ul>
              {categoryNotes.map((item: Note, index: number) => (
                <NoteItem
                  handleNoteDelete={handleNoteDelete}
                  handlePinToggle={handlePinToggle}
                  isHighlighted={false}
                  isPinned={isNotePinned(item)}
                  isSearching={false}
                  item={item}
                  key={item._id}
                  onNoteEdit={handleEdit}
                  openSwipeItemSlug={openSwipeItemSlug}
                  selectedNoteSlug={selectedNoteSlug}
                  sessionId={sessionId}
                  setOpenSwipeItemSlug={setOpenSwipeItemSlug}
                  showDivider={index < categoryNotes.length - 1}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );

  const renderSearchResults = () => {
    if (localSearchResults === null) {
      return renderCategoryList();
    }
    if (localSearchResults.length > 0) {
      return (
        <ul className="px-2">
          {localSearchResults.map((item: Note, index: number) => (
            <NoteItem
              handleNoteDelete={handleDelete}
              handlePinToggle={handlePinToggleWithClear}
              isHighlighted={index === highlightedIndex}
              isPinned={isNotePinned(item)}
              isSearching={true}
              item={item}
              key={item._id}
              onNoteEdit={handleEdit}
              openSwipeItemSlug={openSwipeItemSlug}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              showDivider={index < localSearchResults.length - 1}
            />
          ))}
        </ul>
      );
    }
    return (
      <p className="mt-4 px-2 text-muted-foreground text-sm">
        No results found
      </p>
    );
  };

  return <div className="py-2">{renderSearchResults()}</div>;
}
