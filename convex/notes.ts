import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all public notes
export const getPublicNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();
    return notes;
  },
});

// Query to get a note by slug
// Private notes are only returned if the sessionId matches
export const getNoteBySlug = query({
  args: {
    slug: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, { slug, sessionId }) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!note) {
      return null;
    }

    // Public notes are always accessible
    if (note.public) {
      return note;
    }

    // Private notes are only accessible to the owning session
    if (note.sessionId && sessionId && note.sessionId === sessionId) {
      return note;
    }

    // Otherwise, treat as not found (don't expose private notes)
    return null;
  },
});

// Query to get session notes
export const getSessionNotes = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return notes;
  },
});

// Query to get all notes (admin only)
export const getAllNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("notes").collect();
    return notes;
  },
});

// Mutation to create a new note
export const createNote = mutation({
  args: {
    slug: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    emoji: v.optional(v.string()),
    public: v.boolean(),
    sessionId: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("notes", {
      slug: args.slug,
      title: args.title ?? "",
      content: args.content ?? "",
      emoji: args.emoji ?? "👋🏼",
      public: args.public,
      sessionId: args.sessionId,
      category: args.category ?? "today",
      updatedAt: Date.now(),
    });
    return noteId;
  },
});

// Mutation to update note title
export const updateNoteTitle = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note || note.sessionId !== args.sessionId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.patch(note._id, { title: args.title, updatedAt: Date.now() });
  },
});

// Mutation to update note emoji
export const updateNoteEmoji = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note || note.sessionId !== args.sessionId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.patch(note._id, { emoji: args.emoji, updatedAt: Date.now() });
  },
});

// Mutation to update note content
export const updateNoteContent = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note || note.sessionId !== args.sessionId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.patch(note._id, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Mutation to update multiple note fields at once
export const updateNote = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    title: v.optional(v.string()),
    emoji: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note || note.sessionId !== args.sessionId) {
      throw new Error("Note not found or unauthorized");
    }

    const updates: {
      title?: string;
      emoji?: string;
      content?: string;
      updatedAt?: number;
    } = {};
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.emoji !== undefined) {
      updates.emoji = args.emoji;
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await ctx.db.patch(note._id, updates);
    }
  },
});

// Mutation to delete a note
export const deleteNote = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note || note.sessionId !== args.sessionId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(note._id);
  },
});

// ============ ADMIN MUTATIONS ============

// Admin: Update any note (public or private)
export const adminUpdateNote = mutation({
  args: {
    slug: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    emoji: v.optional(v.string()),
    public: v.optional(v.boolean()),
    category: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    pinOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note) {
      throw new Error("Note not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.emoji !== undefined) {
      updates.emoji = args.emoji;
    }
    if (args.public !== undefined) {
      updates.public = args.public;
    }
    if (args.category !== undefined) {
      updates.category = args.category;
    }
    if (args.pinned !== undefined) {
      updates.pinned = args.pinned;
    }
    if (args.pinOrder !== undefined) {
      updates.pinOrder = args.pinOrder;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await ctx.db.patch(note._id, updates);
    }

    return { success: true };
  },
});

// Admin: Create a public note
export const adminCreateNote = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    emoji: v.optional(v.string()),
    public: v.boolean(),
    category: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("A note with this slug already exists");
    }

    const noteId = await ctx.db.insert("notes", {
      slug: args.slug,
      title: args.title,
      content: args.content ?? "",
      emoji: args.emoji ?? "📝",
      public: args.public,
      category: args.category,
      pinned: args.pinned,
      updatedAt: Date.now(),
    });

    return noteId;
  },
});

// Admin: Delete any note
export const adminDeleteNote = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!note) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(note._id);
    return { success: true };
  },
});

// Admin: Update note slug
export const adminUpdateSlug = mutation({
  args: {
    oldSlug: v.string(),
    newSlug: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if new slug already exists
    const existingNote = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.newSlug))
      .first();

    if (existingNote) {
      throw new Error("A note with this slug already exists");
    }

    // Find the note with old slug
    const note = await ctx.db
      .query("notes")
      .withIndex("by_slug", (q) => q.eq("slug", args.oldSlug))
      .first();

    if (!note) {
      throw new Error("Note not found");
    }

    // Update the slug
    await ctx.db.patch(note._id, { slug: args.newSlug });
    return { success: true };
  },
});

// Admin: Update pin order for multiple notes at once
export const adminUpdatePinOrder = mutation({
  args: {
    orders: v.array(
      v.object({
        slug: v.string(),
        pinOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const { slug, pinOrder } of args.orders) {
      const note = await ctx.db
        .query("notes")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (note) {
        await ctx.db.patch(note._id, { pinOrder });
      }
    }
    return { success: true };
  },
});
