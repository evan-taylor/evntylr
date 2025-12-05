// Note type for the application
// Convex will provide _id and _creationTime when using Convex queries
export type Note = {
  _id: string;
  _creationTime: number;
  slug: string;
  title?: string;
  content?: string;
  emoji?: string;
  public: boolean;
  sessionId?: string;
  category?: string;
  pinned?: boolean;
  pinOrder?: number;
  updatedAt?: number;
};

// Input type for creating a note (without Convex-specific fields)
export type CreateNoteInput = {
  slug: string;
  title?: string;
  content?: string;
  emoji?: string;
  public: boolean;
  sessionId?: string;
  category?: string;
};
