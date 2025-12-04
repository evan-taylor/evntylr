import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { CreateNoteInput } from "./types";

type CreateNoteMutation = (args: CreateNoteInput) => Promise<string>;

type CreateNoteOptions = {
  sessionId: string | null;
  router: { push: (path: string) => void; refresh: () => void };
  addNewPinnedNote: (slug: string) => void;
  refreshSessionNotes: () => Promise<void>;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  createNoteMutation: CreateNoteMutation;
};

export async function createNote(options: CreateNoteOptions) {
  const {
    sessionId,
    router,
    addNewPinnedNote,
    refreshSessionNotes,
    setSelectedNoteSlug,
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
      addNewPinnedNote(slug);
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/${slug}`);
        router.refresh();
      });
    }

    toast.success("Private note created");
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
