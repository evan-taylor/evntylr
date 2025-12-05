import posthog from "posthog-js";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { CreateNoteInput } from "./types";

type CreateNoteMutation = (args: CreateNoteInput) => Promise<string>;

type CreateNoteOptions = {
  sessionId: string | null;
  router: { push: (path: string) => void; refresh: () => void };
  addNewPinnedNote: (slug: string, isCurrentlyPinned: boolean) => void;
  refreshSessionNotes: () => Promise<void>;
  isMobile: boolean;
  createNoteMutation: CreateNoteMutation;
};

export async function createNote(options: CreateNoteOptions) {
  const {
    sessionId,
    router,
    addNewPinnedNote,
    refreshSessionNotes,
    isMobile,
    createNoteMutation,
  } = options;

  const noteId = uuidv4();
  const slug = `new-note-${noteId}`;

  try {
    await createNoteMutation({
      slug,
      title: "",
      content: "",
      public: false,
      sessionId: sessionId ?? undefined,
      category: "today",
      emoji: "👋🏼",
    });

    if (isMobile) {
      // On mobile, update localStorage directly without triggering React state.
      // This prevents the note from flashing in the sidebar before navigation.
      // The sidebar will read the updated pinnedNotes from localStorage when it remounts.
      const storedPinnedNotes = localStorage.getItem("pinnedNotes");
      const pinnedNotes = storedPinnedNotes
        ? JSON.parse(storedPinnedNotes)
        : [];
      if (!pinnedNotes.includes(slug)) {
        pinnedNotes.push(slug);
        localStorage.setItem("pinnedNotes", JSON.stringify(pinnedNotes));
      }
      router.push(`/${slug}`);
    } else {
      addNewPinnedNote(slug, false);
      refreshSessionNotes().then(() => {
        // Navigate to the new note - the pathname change will update the sidebar selection automatically
        router.push(`/${slug}`);
      });
    }

    // Track note creation event
    posthog.capture("note_created", {
      note_slug: slug,
      is_mobile: isMobile,
      session_id: sessionId,
    });

    toast.success("Private note created");
  } catch (error) {
    console.error("Error creating note:", error);
    posthog.captureException(error as Error);
  }
}
