"use client";

import { useMutation } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  Moon,
  PenSquare,
  Pin,
  Sun,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { api } from "@/convex/_generated/api";
import { createNote } from "@/lib/create-note";
import { searchNotes } from "@/lib/search";
import type { Note } from "@/lib/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";
import { DialogDescription, DialogTitle } from "./ui/dialog";

export type CommandMenuProps = {
  notes: Note[];
  sessionId: string;
  addNewPinnedNote: (slug: string, isCurrentlyPinned: boolean) => void;
  navigateNotes: (direction: "up" | "down") => void;
  togglePinned: (slug: string, isCurrentlyPinned: boolean) => void;
  deleteNote: (note: Note) => void;
  highlightedNote: Note | null;
  ref: React.RefObject<{ setOpen: (open: boolean) => void } | null>;
  isMobile: boolean;
  pinnedNotes: Set<string>;
  unpinnedPublicNotes: Set<string>;
};

export const CommandMenu = forwardRef<
  { setOpen: (open: boolean) => void },
  CommandMenuProps
>(
  (
    {
      notes,
      sessionId,
      addNewPinnedNote,
      navigateNotes,
      togglePinned,
      deleteNote,
      highlightedNote,
      isMobile,
      pinnedNotes,
      unpinnedPublicNotes,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();
    const { setTheme, theme } = useTheme();

    const createNoteMutation = useMutation(api.notes.createNote);

    useImperativeHandle(ref, () => ({
      setOpen: (newOpen: boolean) => {
        setOpen(newOpen);
      },
    }));

    useEffect(() => {
      if (open) {
        const timeoutId = setTimeout(() => {
          const input = document.querySelector(
            "[cmdk-input]"
          ) as HTMLInputElement;
          input?.focus();
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        setSearchTerm("");
      }
    }, [open]);

    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((currentOpen) => {
            const newOpen = !currentOpen;
            if (newOpen) {
              posthog.capture("command_menu_opened", {
                trigger: "keyboard_shortcut",
              });
            }
            return newOpen;
          });
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);

    function toTitleCase(str: string): string {
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );
    }

    const { refreshSessionNotes } = useContext(SessionNotesContext);

    const handleCreateNote = () => {
      createNote({
        sessionId,
        router,
        addNewPinnedNote,
        refreshSessionNotes,
        isMobile,
        createNoteMutation,
      });
      setOpen(false);
    };

    const handleNoteSelect = (slug: string) => {
      router.push(`/${slug}`);
      setOpen(false);
    };

    const handleMoveUp = useCallback(() => {
      navigateNotes("up");
      setOpen(false);
    }, [navigateNotes]);

    const handleMoveDown = useCallback(() => {
      navigateNotes("down");
      setOpen(false);
    }, [navigateNotes]);

    const handleTogglePin = useCallback(() => {
      if (highlightedNote) {
        const isExplicitlyUnpinned =
          highlightedNote.public &&
          highlightedNote.pinned === true &&
          unpinnedPublicNotes.has(highlightedNote.slug);
        const isCurrentlyPinned =
          !isExplicitlyUnpinned &&
          (highlightedNote.pinned === true ||
            pinnedNotes.has(highlightedNote.slug));
        togglePinned(highlightedNote.slug, isCurrentlyPinned);
        setOpen(false);
      }
    }, [highlightedNote, togglePinned, pinnedNotes, unpinnedPublicNotes]);

    const handleDeleteNote = useCallback(() => {
      if (highlightedNote) {
        deleteNote(highlightedNote);
        setOpen(false);
      }
    }, [highlightedNote, deleteNote]);

    const commands = [
      {
        name: "New note",
        icon: <PenSquare />,
        shortcut: "N",
        action: handleCreateNote,
      },
      {
        name: "Pin or unpin",
        icon: <Pin />,
        shortcut: "P",
        action: handleTogglePin,
      },
      {
        name: "Move up",
        icon: <ArrowUp />,
        shortcut: "K",
        action: handleMoveUp,
      },
      {
        name: "Move down",
        icon: <ArrowDown />,
        shortcut: "J",
        action: handleMoveDown,
      },
      {
        name: "Delete note",
        icon: <Trash />,
        shortcut: "D",
        action: handleDeleteNote,
      },
      {
        name: "Toggle theme",
        icon:
          theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          ),
        shortcut: "T",
        action: () => {
          setTheme(theme === "light" ? "dark" : "light");
          setOpen(false);
        },
      },
    ];

    const filteredNotes = searchNotes(notes, searchTerm, sessionId);
    const filteredCommands = commands.filter((command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <CommandDialog onOpenChange={setOpen} open={open}>
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Use this dialog to execute commands or search for a note
        </DialogDescription>
        <CommandInput
          onValueChange={setSearchTerm}
          placeholder="Type a command or search for a note..."
          value={searchTerm}
        />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          {filteredCommands.length > 0 && (
            <CommandGroup heading="Commands">
              {filteredCommands.map((command) => (
                <CommandItem key={command.name} onSelect={command.action}>
                  {command.icon}
                  <span className="ml-2">{command.name}</span>
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {filteredNotes.length > 0 && (
            <CommandGroup heading="Notes">
              {filteredNotes.map((note) => (
                <CommandItem
                  key={note._id}
                  onSelect={() => handleNoteSelect(note.slug)}
                >
                  {note.emoji} {toTitleCase(note.title ?? "")}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    );
  }
);

CommandMenu.displayName = "CommandMenu";
