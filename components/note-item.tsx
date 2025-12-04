import Link from "next/link";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { useSwipeable } from "react-swipeable";
import { useMobileDetect } from "@/components/mobile-detector";
import { getDisplayDateByCategory } from "@/lib/note-utils";
import type { Note } from "@/lib/types";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

function previewContent(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[[ x]\]/g, "")
    .replace(/[#*_~`>+-]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Types for helper functions
type NoteItemState = {
  isMobile: boolean | null;
  isSearching: boolean;
  isHighlighted: boolean;
  itemSlug: string;
  selectedNoteSlug: string | null;
};

// Helper to determine if note item is selected/highlighted
function isItemSelected(state: NoteItemState): boolean {
  if (state.isMobile) {
    return false;
  }
  if (state.isSearching) {
    return state.isHighlighted;
  }
  return state.itemSlug === state.selectedNoteSlug;
}

// Helper to determine if divider should be shown
function shouldShowDivider(
  state: NoteItemState,
  showDivider: boolean
): boolean {
  if (state.isMobile || !showDivider) {
    return false;
  }
  if (state.isSearching) {
    return !state.isHighlighted;
  }
  return state.itemSlug !== state.selectedNoteSlug;
}

type NoteItemProps = {
  item: Note;
  selectedNoteSlug: string | null;
  sessionId: string;
  onNoteSelect: (note: Note) => void;
  onNoteEdit: (slug: string) => void;
  handlePinToggle: (slug: string) => void;
  isPinned: boolean;
  isHighlighted: boolean;
  isSearching: boolean;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: Dispatch<SetStateAction<string | null>>;
  showDivider?: boolean;
};

export const NoteItem = React.memo(function NoteItemComponent({
  item,
  selectedNoteSlug,
  sessionId,
  onNoteSelect: _onNoteSelect,
  onNoteEdit,
  handlePinToggle,
  isPinned,
  isHighlighted,
  isSearching,
  handleNoteDelete,
  openSwipeItemSlug,
  setOpenSwipeItemSlug,
  showDivider = false,
}: NoteItemProps) {
  // Note: _onNoteSelect is kept for prop compatibility
  const _ = _onNoteSelect; // Silence unused variable warning
  const isMobile = useMobileDetect();
  const [isSwiping, setIsSwiping] = useState(false);
  const isSwipeOpen = openSwipeItemSlug === item.slug;

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwiping) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isSwiping]);

  const handleDelete = async () => {
    setOpenSwipeItemSlug(null);
    await handleNoteDelete(item);
  };

  const handleEdit = () => {
    setOpenSwipeItemSlug(null);
    onNoteEdit(item.slug);
  };

  const handlePinAction = () => {
    handlePinToggle(item.slug);
    setOpenSwipeItemSlug(null);
  };

  const canEditOrDelete = item.sessionId === sessionId;

  const handleSwipeAction = (action: () => void) => {
    if (isSwipeOpen) {
      action();
    }
  };

  // Pre-compute selection state
  const itemState: NoteItemState = {
    isMobile,
    isSearching,
    isHighlighted,
    itemSlug: item.slug,
    selectedNoteSlug,
  };
  const isSelected = isItemSelected(itemState);
  const displayDivider = shouldShowDivider(itemState, showDivider);

  const selectedClass = isSelected
    ? "rounded-md bg-[#FFE390] dark:bg-[#9D7D28] dark:text-white"
    : "";
  const dividerClass = displayDivider
    ? 'after:mx-2 after:block after:border-muted-foreground/20 after:border-t after:content-[""]'
    : "";
  const previewClass = isSelected
    ? "text-muted-foreground dark:text-white/80"
    : "text-muted-foreground";

  const NoteContent = (
    <li
      className={`h-[70px] w-full transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] ${selectedClass} ${dividerClass}`}
    >
      <div className={"h-full w-full px-4"} data-note-slug={item.slug}>
        <Link
          className="block flex h-full w-full flex-col justify-center py-2"
          href={`/${item.slug || ""}`}
          prefetch={true}
          tabIndex={-1}
        >
          <h2 className="line-clamp-1 break-words px-2 font-bold text-sm">
            {item.emoji} {item.title}
          </h2>
          <p
            className={`line-clamp-1 break-words pl-2 text-xs ${previewClass}`}
          >
            <span className="text-black dark:text-white">
              {getDisplayDateByCategory(
                item.category,
                item._id
              ).toLocaleDateString("en-US")}
            </span>{" "}
            {previewContent(item.content ?? "")}
          </p>
        </Link>
      </div>
    </li>
  );

  const handlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => {
      setOpenSwipeItemSlug(item.slug);
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setOpenSwipeItemSlug(null);
      setIsSwiping(false);
    },
    trackMouse: true,
  });

  if (isMobile) {
    return (
      <div {...handlers} className="relative overflow-hidden">
        <div
          className={`w-full transition-transform duration-300 ease-out ${
            isSwipeOpen ? "-translate-x-24 transform" : ""
          } ${
            showDivider
              ? 'after:mx-6 after:block after:border-muted-foreground/20 after:border-t after:content-[""]'
              : ""
          }`}
          data-note-slug={item.slug}
        >
          {NoteContent}
        </div>
        <SwipeActions
          canEditOrDelete={canEditOrDelete}
          isOpen={isSwipeOpen}
          isPinned={isPinned}
          onDelete={() => handleSwipeAction(handleDelete)}
          onEdit={() => handleSwipeAction(handleEdit)}
          onPin={() => handleSwipeAction(handlePinAction)}
        />
      </div>
    );
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger>{NoteContent}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="cursor-pointer" onClick={handlePinAction}>
          {isPinned ? "Unpin" : "Pin"}
        </ContextMenuItem>
        {item.sessionId === sessionId && (
          <>
            <ContextMenuItem className="cursor-pointer" onClick={handleEdit}>
              Edit
            </ContextMenuItem>
            <ContextMenuItem className="cursor-pointer" onClick={handleDelete}>
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});
