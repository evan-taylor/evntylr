import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    slug: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    emoji: v.optional(v.string()),
    public: v.boolean(),
    sessionId: v.optional(v.string()),
    category: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    pinOrder: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_session", ["sessionId"])
    .index("by_public", ["public"]),
});
