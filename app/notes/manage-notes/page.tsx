"use client";

import { useMutation, useQuery } from "convex/react";
import { EmojiPicker } from "frimousse";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Note } from "@/lib/types";

type EmojiData = {
  emoji: string;
};

// Reusable emoji picker field component
function EmojiPickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close picker
  useEffect(() => {
    if (!showPicker) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  return (
    <div className="relative">
      <span className="mb-1 block font-medium text-sm">Emoji</span>
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-muted/50"
        onClick={() => setShowPicker(!showPicker)}
        type="button"
      >
        <span className="text-xl">{value}</span>
        <span className="text-muted-foreground text-xs">Click to change</span>
      </button>
      {showPicker === true && (
        <div
          className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-border bg-popover p-2 shadow-lg"
          ref={pickerRef}
        >
          <EmojiPicker.Root
            className="flex h-[300px] w-[280px] flex-col"
            onEmojiSelect={(data: EmojiData) => {
              onChange(data.emoji);
              setShowPicker(false);
            }}
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
  );
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Note>>({});
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({
    slug: "",
    title: "",
    content: "",
    emoji: "📝",
    public: true,
    category: "",
    pinned: false,
  });

  const notes = useQuery(api.notes.getAllNotes) as Note[] | undefined;
  const updateNote = useMutation(api.notes.adminUpdateNote);
  const createNote = useMutation(api.notes.adminCreateNote);
  const deleteNote = useMutation(api.notes.adminDeleteNote);
  const updatePinOrder = useMutation(api.notes.adminUpdatePinOrder);

  // Get sorted pinned notes
  const pinnedNotes = useMemo(() => {
    if (!notes) {
      return [];
    }
    return notes
      .filter((n) => n.public && n.pinned)
      .sort((a, b) => {
        const orderA = a.pinOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.pinOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return b._creationTime - a._creationTime;
      });
  }, [notes]);

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) {
        return;
      }
      const newOrder = [...pinnedNotes];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      const orders = newOrder.map((note, i) => ({
        slug: note.slug,
        pinOrder: i,
      }));
      try {
        await updatePinOrder({ orders });
        toast.success("Order updated");
      } catch (error) {
        console.error("Failed to update order:", error);
        toast.error("Failed to update order");
      }
    },
    [pinnedNotes, updatePinOrder]
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index === pinnedNotes.length - 1) {
        return;
      }
      const newOrder = [...pinnedNotes];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      const orders = newOrder.map((note, i) => ({
        slug: note.slug,
        pinOrder: i,
      }));
      try {
        await updatePinOrder({ orders });
        toast.success("Order updated");
      } catch (error) {
        console.error("Failed to update order:", error);
        toast.error("Failed to update order");
      }
    },
    [pinnedNotes, updatePinOrder]
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      posthog.capture("admin_login_success");
    } else {
      posthog.capture("admin_login_failed");
      toast.error("Incorrect password");
    }
  };

  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note.slug);
    setEditForm({
      title: note.title,
      content: note.content,
      emoji: note.emoji,
      public: note.public,
      category: note.category,
      pinned: note.pinned,
    });
  }, []);

  const handleSave = useCallback(
    async (slug: string) => {
      try {
        await updateNote({
          slug,
          ...editForm,
        });
        setEditingNote(null);
        setEditForm({});
        posthog.capture("admin_note_updated", {
          note_slug: slug,
          updated_fields: Object.keys(editForm),
        });
        toast.success("Note updated");
      } catch (error) {
        console.error("Failed to update note:", error);
        posthog.captureException(error as Error);
        toast.error("Failed to update note");
      }
    },
    [editForm, updateNote]
  );

  const handleTogglePublic = useCallback(
    async (note: Note) => {
      try {
        await updateNote({
          slug: note.slug,
          public: !note.public,
        });
      } catch (error) {
        console.error("Failed to toggle public:", error);
      }
    },
    [updateNote]
  );

  const handleTogglePinned = useCallback(
    async (note: Note) => {
      try {
        if (note.pinned) {
          // Unpinning - just remove pinned flag
          await updateNote({
            slug: note.slug,
            pinned: false,
          });
        } else {
          // Pinning - set pinOrder to end of list
          const maxOrder = pinnedNotes.reduce(
            (max: number, n: Note) => Math.max(max, n.pinOrder ?? 0),
            -1
          );
          await updateNote({
            slug: note.slug,
            pinned: true,
            pinOrder: maxOrder + 1,
          });
        }
      } catch (error) {
        console.error("Failed to toggle pinned:", error);
      }
    },
    [updateNote, pinnedNotes]
  );

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (slug: string) => {
      if (deleteConfirm !== slug) {
        setDeleteConfirm(slug);
        toast("Click delete again to confirm");
        return;
      }
      setDeleteConfirm(null);
      try {
        await deleteNote({ slug });
        posthog.capture("admin_note_deleted", {
          note_slug: slug,
        });
        toast.success("Note deleted");
      } catch (error) {
        console.error("Failed to delete note:", error);
        posthog.captureException(error as Error);
        toast.error("Failed to delete note");
      }
    },
    [deleteNote, deleteConfirm]
  );

  const handleCreateNote = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!(newNote.slug && newNote.title)) {
        toast.error("Slug and title are required");
        return;
      }
      try {
        // If pinning, set pinOrder to end of list
        let pinOrder: number | undefined;
        if (newNote.pinned) {
          const maxOrder = pinnedNotes.reduce(
            (max: number, n: Note) => Math.max(max, n.pinOrder ?? 0),
            -1
          );
          pinOrder = maxOrder + 1;
        }

        await createNote({
          slug: newNote.slug,
          title: newNote.title,
          content: newNote.content,
          emoji: newNote.emoji,
          public: newNote.public,
          category: newNote.category || undefined,
          pinned: newNote.pinned,
        });

        // If pinned, update the pin order
        if (newNote.pinned && pinOrder !== undefined) {
          await updateNote({
            slug: newNote.slug,
            pinOrder,
          });
        }

        posthog.capture("admin_note_created", {
          note_slug: newNote.slug,
          is_public: newNote.public,
          is_pinned: newNote.pinned,
        });

        setNewNote({
          slug: "",
          title: "",
          content: "",
          emoji: "📝",
          public: true,
          category: "",
          pinned: false,
        });
        setShowNewNoteForm(false);
        toast.success("Note created");
      } catch (error) {
        console.error("Failed to create note:", error);
        posthog.captureException(error as Error);
        toast.error("Failed to create note. Slug may already exist.");
      }
    },
    [createNote, newNote, pinnedNotes, updateNote]
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <form
          className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg"
          onSubmit={handleLogin}
        >
          <div className="flex items-center justify-center gap-2 font-bold text-xl">
            <Lock className="h-5 w-5" />
            Admin Access
          </div>
          <input
            autoFocus
            className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            type="password"
            value={password}
          />
          <button
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  const publicNotes = notes?.filter((n) => n.public) ?? [];
  const privateNotes = notes?.filter((n) => !n.public) ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-bold text-2xl">📝 Note Admin</h1>
          <button
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={() => setShowNewNoteForm(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>

        {/* New Note Form */}
        {showNewNoteForm === true && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Create New Note</h2>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewNoteForm(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateNote}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-1 block font-medium text-sm"
                    htmlFor="new-slug"
                  >
                    Slug
                  </label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="new-slug"
                    onChange={(e) =>
                      setNewNote({ ...newNote, slug: e.target.value })
                    }
                    placeholder="about-me"
                    type="text"
                    value={newNote.slug}
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block font-medium text-sm"
                    htmlFor="new-title"
                  >
                    Title
                  </label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="new-title"
                    onChange={(e) =>
                      setNewNote({ ...newNote, title: e.target.value })
                    }
                    placeholder="About Me"
                    type="text"
                    value={newNote.title}
                  />
                </div>
                <EmojiPickerField
                  onChange={(emoji) => setNewNote({ ...newNote, emoji })}
                  value={newNote.emoji}
                />
                <div>
                  <label
                    className="mb-1 block font-medium text-sm"
                    htmlFor="new-category"
                  >
                    Category
                  </label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="new-category"
                    onChange={(e) =>
                      setNewNote({ ...newNote, category: e.target.value })
                    }
                    placeholder="Optional category"
                    type="text"
                    value={newNote.category}
                  />
                </div>
              </div>
              <div>
                <label
                  className="mb-1 block font-medium text-sm"
                  htmlFor="new-content"
                >
                  Content (Markdown)
                </label>
                <Textarea
                  className="min-h-[200px] rounded-md border border-border px-3 py-2 leading-relaxed focus:ring-1 focus:ring-ring"
                  id="new-content"
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder="Write your markdown content here..."
                  value={newNote.content}
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={newNote.public}
                    className="h-4 w-4"
                    onChange={(e) =>
                      setNewNote({ ...newNote, public: e.target.checked })
                    }
                    type="checkbox"
                  />
                  <span className="text-sm">Public</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={newNote.pinned}
                    className="h-4 w-4"
                    onChange={(e) =>
                      setNewNote({ ...newNote, pinned: e.target.checked })
                    }
                    type="checkbox"
                  />
                  <span className="text-sm">Pinned for all users</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted"
                  onClick={() => setShowNewNoteForm(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  Create Note
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pinned Notes Reordering */}
        {pinnedNotes.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
              <Pin className="h-5 w-5 fill-current text-amber-500" />
              Pinned Notes Order ({pinnedNotes.length})
            </h2>
            <p className="mb-4 text-muted-foreground text-sm">
              Reorder how pinned notes appear for all visitors. Notes at the top
              appear first.
            </p>
            <div className="space-y-1 rounded-lg border border-border bg-card p-2">
              {pinnedNotes.map((note: Note, index: number) => (
                <div
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background p-3 transition-colors hover:bg-muted/50"
                  key={note._id}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="w-6 font-mono text-muted-foreground text-sm">
                      {index + 1}
                    </span>
                    <span className="text-xl">{note.emoji}</span>
                    <span className="font-medium">
                      {note.title || "Untitled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className={`rounded-md p-2 transition-colors ${
                        index === 0
                          ? "cursor-not-allowed text-muted-foreground/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title="Move up"
                      type="button"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      className={`rounded-md p-2 transition-colors ${
                        index === pinnedNotes.length - 1
                          ? "cursor-not-allowed text-muted-foreground/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      disabled={index === pinnedNotes.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title="Move down"
                      type="button"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Public Notes */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
            <Eye className="h-5 w-5" />
            Public Notes ({publicNotes.length})
          </h2>
          <div className="space-y-2">
            {publicNotes.map((note) => (
              <NoteRow
                editForm={editForm}
                isEditing={editingNote === note.slug}
                key={note._id}
                note={note}
                onCancel={() => {
                  setEditingNote(null);
                  setEditForm({});
                }}
                onDelete={() => handleDelete(note.slug)}
                onEdit={() => handleEdit(note)}
                onSave={() => handleSave(note.slug)}
                onTogglePinned={() => handleTogglePinned(note)}
                onTogglePublic={() => handleTogglePublic(note)}
                setEditForm={setEditForm}
              />
            ))}
            {publicNotes.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                No public notes yet
              </p>
            )}
          </div>
        </section>

        {/* Private Notes */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
            <EyeOff className="h-5 w-5" />
            Private/Session Notes ({privateNotes.length})
          </h2>
          <div className="space-y-2">
            {privateNotes.map((note) => (
              <NoteRow
                editForm={editForm}
                isEditing={editingNote === note.slug}
                key={note._id}
                note={note}
                onCancel={() => {
                  setEditingNote(null);
                  setEditForm({});
                }}
                onDelete={() => handleDelete(note.slug)}
                onEdit={() => handleEdit(note)}
                onSave={() => handleSave(note.slug)}
                onTogglePinned={() => handleTogglePinned(note)}
                onTogglePublic={() => handleTogglePublic(note)}
                setEditForm={setEditForm}
              />
            ))}
            {privateNotes.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                No private notes
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type NoteRowProps = {
  note: Note & { pinned?: boolean };
  isEditing: boolean;
  editForm: Partial<Note>;
  setEditForm: (form: Partial<Note>) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTogglePublic: () => void;
  onTogglePinned: () => void;
  onDelete: () => void;
};

function NoteRow({
  note,
  isEditing,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onCancel,
  onTogglePublic,
  onTogglePinned,
  onDelete,
}: NoteRowProps) {
  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary bg-card p-4">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1 block font-medium text-sm"
              htmlFor={`edit-title-${note.slug}`}
            >
              Title
            </label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              id={`edit-title-${note.slug}`}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              type="text"
              value={editForm.title ?? ""}
            />
          </div>
          <EmojiPickerField
            onChange={(emoji) => setEditForm({ ...editForm, emoji })}
            value={editForm.emoji ?? "📝"}
          />
          <div>
            <label
              className="mb-1 block font-medium text-sm"
              htmlFor={`edit-category-${note.slug}`}
            >
              Category
            </label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              id={`edit-category-${note.slug}`}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value })
              }
              type="text"
              value={editForm.category ?? ""}
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={editForm.public ?? false}
                className="h-4 w-4"
                onChange={(e) =>
                  setEditForm({ ...editForm, public: e.target.checked })
                }
                type="checkbox"
              />
              <span className="text-sm">Public</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={(editForm as { pinned?: boolean }).pinned ?? false}
                className="h-4 w-4"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    pinned: e.target.checked,
                  } as Partial<Note>)
                }
                type="checkbox"
              />
              <span className="text-sm">Pinned</span>
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label
            className="mb-1 block font-medium text-sm"
            htmlFor={`edit-content-${note.slug}`}
          >
            Content (Markdown)
          </label>
          <Textarea
            className="min-h-[200px] rounded-md border border-border px-3 py-2 leading-relaxed focus:ring-1 focus:ring-ring"
            id={`edit-content-${note.slug}`}
            onChange={(e) =>
              setEditForm({ ...editForm, content: e.target.value })
            }
            value={editForm.content ?? ""}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            onClick={onSave}
            type="button"
          >
            <Check className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <span className="text-xl">{note.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{note.title || "Untitled"}</span>
            {note.pinned === true && (
              <Pin className="h-3 w-3 fill-current text-amber-500" />
            )}
          </div>
          <span className="text-muted-foreground text-sm">/{note.slug}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          className={`rounded-md p-2 transition-colors ${
            note.public
              ? "text-green-500 hover:bg-green-500/10"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={onTogglePublic}
          title={note.public ? "Make private" : "Make public"}
          type="button"
        >
          {note.public ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          className={`rounded-md p-2 transition-colors ${
            note.pinned
              ? "text-amber-500 hover:bg-amber-500/10"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={onTogglePinned}
          title={note.pinned ? "Unpin" : "Pin for all users"}
          type="button"
        >
          {note.pinned ? (
            <Pin className="h-4 w-4 fill-current" />
          ) : (
            <PinOff className="h-4 w-4" />
          )}
        </button>
        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onEdit}
          title="Edit"
          type="button"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
          onClick={onDelete}
          title="Delete"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
