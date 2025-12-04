import { mutation } from "./_generated/server";

// Generate an upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// Note: File URLs are constructed directly from storage IDs on the client side
// The pattern is: ${CONVEX_URL}/api/storage/${storageId}
