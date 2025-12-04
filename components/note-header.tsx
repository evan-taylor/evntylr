"use client";

import { format } from "date-fns";
import { EmojiPicker } from "frimousse";
import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getDisplayDateByCategory } from "@/lib/note-utils";
import type { Note } from "@/lib/types";
import { Icons } from "./icons";
import { useMobileDetect } from "./mobile-detector";
import { Input } from "./ui/input";

type EmojiData = {
  emoji: string;
};

export default function NoteHeader({
  note,
  saveNote,
  canEdit,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
}) {
  const isMobile = useMobileDetect();
  const pathname = usePathname();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const displayDate = getDisplayDateByCategory(note.category, note._id);
    setFormattedDate(format(displayDate, "MMMM d, yyyy 'at' h:mm a"));
  }, [note.category, note._id]);

  // Handle click outside to close picker
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiSelect = (data: EmojiData) => {
    saveNote({ emoji: data.emoji });
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveNote({ title: e.target.value });
  };

  return (
    <>
      {isMobile === true && pathname !== "/notes" && (
        <Link href="/notes">
          <button className="flex items-center pt-2" type="button">
            <Icons.back />
            <span className="ml-1 text-[#e2a727] text-base">Notes</span>
          </button>
        </Link>
      )}
      <div className="relative mb-4 px-2">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground text-xs">{formattedDate}</p>
          <div className="ml-2 flex h-6 items-center">
            {!note.public && (
              <Badge className="items-center justify-center text-xs">
                <Lock className="mr-1 h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
        </div>
        <div className="relative flex items-center">
          {canEdit === true && note.public === false && isMobile === false ? (
            <button
              className="mr-2 cursor-pointer"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              type="button"
            >
              {note.emoji}
            </button>
          ) : (
            <span className="mr-2">{note.emoji}</span>
          )}
          {note.public || !canEdit ? (
            <span className="min-h-[50px] flex-grow py-2 font-bold text-2xl leading-normal">
              {note.title}
            </span>
          ) : (
            <Input
              autoFocus={!note.title}
              className="min-h-[50px] flex-grow bg-background py-2 font-bold text-2xl leading-normal placeholder:text-muted-foreground"
              id="title"
              onChange={handleTitleChange}
              placeholder="Your title here..."
              value={note.title ?? ""}
            />
          )}
        </div>
        {showEmojiPicker === true &&
          isMobile === false &&
          note.public === false &&
          canEdit === true && (
            <div
              className="absolute top-full left-0 z-10 mt-2 rounded-lg border border-border bg-popover p-2 shadow-lg"
              ref={pickerRef}
            >
              <EmojiPicker.Root
                className="flex h-[360px] w-fit min-w-[352px] flex-col"
                onEmojiSelect={handleEmojiSelect}
              >
                <EmojiPicker.Search
                  autoFocus
                  className="mb-2 h-9 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                  placeholder="Search emoji..."
                />
                <EmojiPicker.Viewport className="flex-1 overflow-y-auto">
                  <EmojiPicker.Loading className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    Loading…
                  </EmojiPicker.Loading>
                  <EmojiPicker.Empty className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No emoji found.
                  </EmojiPicker.Empty>
                  <EmojiPicker.List
                    className="select-none"
                    components={{
                      CategoryHeader: ({ category }) => (
                        <div className="sticky top-0 bg-popover px-1 py-2 font-medium text-muted-foreground text-xs">
                          {category.label}
                        </div>
                      ),
                      Row: ({ children }) => (
                        <div className="flex scroll-my-1">{children}</div>
                      ),
                      Emoji: ({ emoji, ...props }) => (
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded text-xl transition-colors duration-200 hover:bg-accent"
                          type="button"
                          {...props}
                        >
                          {emoji.emoji}
                        </button>
                      ),
                    }}
                  />
                </EmojiPicker.Viewport>
              </EmojiPicker.Root>
            </div>
          )}
      </div>
    </>
  );
}
