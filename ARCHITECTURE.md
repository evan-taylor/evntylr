# Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Component Structure](#component-structure)
5. [Data Flow](#data-flow)
6. [Session Management](#session-management)
7. [Note Pinning System](#note-pinning-system)
8. [Real-Time Updates](#real-time-updates)

## Overview

This is a Next.js 16 notes application with a session-based architecture, inspired by [Alana Goyal's Apple Notes project](https://github.com/alanagoyal/alanagoyal). The app supports two types of notes:

- **Public notes**: Managed by the site owner, visible to all users
- **Private notes**: Session-specific notes that only the creator can see and edit

The app uses **Convex** for real-time data synchronization, with all data fetching happening client-side via reactive queries.

## Tech Stack

### Core Framework

- **Next.js 16** - App Router with React 19
- **React 19** - UI library with Server/Client Component split
- **TypeScript** - Type safety throughout the application

### Backend & Database

- **Convex** - Real-time backend with automatic data synchronization
- Reactive queries (`useQuery`) for automatic UI updates
- Mutations (`useMutation`) for data modifications

### UI & Styling

- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Headless accessible UI components
- **next-themes** - Theme management (dark/light mode)
- **Lucide React** - Icon library
- **Liquid Glass Design System** - Custom CSS utilities for macOS/iOS 26 aesthetic

### Content & Markdown

- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **frimousse** - Emoji picker (React 19 compatible)

### Utilities

- **uuid** - Session ID and note ID generation
- **date-fns** - Date formatting and manipulation
- **Ultracite** - Zero-config Biome preset for linting/formatting

## Architecture Patterns

### Rendering Strategy

All data fetching is client-side using Convex's reactive `useQuery` hooks. There are no Server Components that fetch data - the layout and pages are either static or client-rendered.

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Layout (Server)                     │
│  - Static shell (no data fetching)                          │
│  - Wraps app with ConvexClientProvider + ThemeProvider      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐   ┌─────────▼──────────┐
│  SidebarLayout   │   │ [slug]/page.tsx    │
│  (Client)        │   │ (Client)           │
│  - useQuery for  │   │ - useQuery for     │
│    public notes  │   │   single note      │
│  - Real-time     │   │ - Real-time        │
│    updates       │   │   updates          │
└──────────────────┘   └────────────────────┘
```

### Client vs Server Components

#### Server Components (Static)

- `app/notes/layout.tsx` - Root layout shell (no data fetching)
- `app/sitemap.ts` - Dynamic sitemap generation

#### Client Components ('use client')

- `components/sidebar-layout.tsx` - Layout with Convex queries for public notes
- `components/sidebar.tsx` - Sidebar with keyboard shortcuts, search, pinning
- `app/notes/[slug]/page.tsx` - Note page with Convex query
- `components/note.tsx` - Note editor with debounced saves
- `components/note-header.tsx` - Title and emoji editor
- `components/note-content.tsx` - Markdown editor/viewer
- `components/new-note.tsx` - New note creation button
- `components/command-menu.tsx` - Cmd+K command palette
- `components/search.tsx` - Search bar with live filtering
- `components/session-id.tsx` - Session ID manager
- `app/notes/session-notes.tsx` - Session notes context provider
- `components/theme-provider.tsx` - Theme context wrapper

## Component Structure

### Component Hierarchy

```
app/notes/layout.tsx (Server - static shell)
└── ConvexClientProvider
    └── ThemeProvider
        └── SidebarLayout (Client)
            ├── SessionNotesProvider (Context)
            │   ├── Sidebar (Client)
            │   │   ├── Nav
            │   │   │   └── NewNote
            │   │   ├── CommandMenu
            │   │   ├── SearchBar
            │   │   └── SidebarContent
            │   │       └── NoteItem (multiple)
            │   │           └── ContextMenu
            │   └── ScrollArea
            │       └── children (Note page)
            │           └── Note (Client)
            │               ├── SessionId
            │               ├── NoteHeader
            │               └── NoteContent
            └── Toaster
```

### Key Component Responsibilities

#### `components/sidebar-layout.tsx` (Client)

- **Purpose**: Main layout that fetches public notes
- **Data Fetching**: `useQuery(api.notes.getPublicNotes)` - reactive Convex query
- **Real-time**: Automatically updates when public notes change

#### `app/notes/[slug]/page.tsx` (Client)

- **Purpose**: Individual note page
- **Data Fetching**: `useQuery(api.notes.getNoteBySlug, { slug })` - reactive
- **Features**: Dynamic metadata updates, loading states, error handling

#### `components/sidebar.tsx` (Client)

- **Purpose**: Main sidebar with note list, search, keyboard shortcuts
- **State Management**: Pinning preferences, search, keyboard navigation
- **Features**:
  - Keyboard navigation (j/k, arrow keys)
  - Pin/unpin notes (localStorage with per-user preferences)
  - Delete notes (Convex mutation)
  - Search with live results
  - Theme toggle (t key)
  - Command palette (Cmd+K)

#### `components/note.tsx` (Client)

- **Purpose**: Note editor with auto-save
- **Debouncing**: 500ms delay before saving changes
- **Data Updates**: Single Convex mutation for all field updates
- **Real-time**: Changes propagate automatically via Convex reactivity

#### `app/notes/session-notes.tsx` (Client Context)

- **Purpose**: Provides session notes to all components
- **Data Fetching**: `useQuery(api.notes.getSessionNotes, { sessionId })`
- **Real-time**: Convex handles automatic updates (no manual refresh needed)

## Data Flow

### Initial Page Load

```
1. User visits /about-me
   │
2. app/notes/layout.tsx (Server - static)
   ├── Renders ConvexClientProvider wrapper
   │
3. SidebarLayout mounts (Client)
   ├── useQuery(api.notes.getPublicNotes) - subscribes to public notes
   │
4. SessionNotesProvider mounts
   ├── SessionId generates/retrieves UUID from localStorage
   ├── useQuery(api.notes.getSessionNotes, { sessionId }) - subscribes
   │
5. [slug]/page.tsx mounts (Client)
   ├── useQuery(api.notes.getNoteBySlug, { slug }) - subscribes
   │
6. All queries resolve and UI renders
   └── Convex maintains WebSocket connection for real-time updates
```

**Key Difference from Supabase Architecture**:

- No server-side data fetching
- No ISR/revalidation needed
- All updates are real-time via Convex subscriptions

### Note Edit Flow

```
1. User types in note editor
   │
2. NoteContent onChange fires
   ├── Calls saveNote({ content: newContent })
   │
3. saveNote function (debounced 500ms)
   ├── Clears previous timeout
   ├── Updates local state immediately (optimistic update)
   ├── After 500ms:
   │   └── updateNoteMutation({ slug, sessionId, title, emoji, content })
   │
4. Convex processes mutation
   ├── Updates database
   └── Broadcasts change to all subscribers
   │
5. All connected clients automatically receive update
   └── useQuery hooks re-render with new data
```

**No manual refresh needed** - Convex reactivity handles everything.

### Note Creation Flow

```
1. User clicks "New Note" button or presses 'N'
   │
2. createNote() function (lib/create-note.ts)
   ├── Generate noteId = uuidv4()
   ├── Generate slug = "new-note-{noteId}"
   │
3. Convex mutation
   ├── createNoteMutation({ slug, title, content, sessionId, ... })
   │
4. Post-creation flow (Desktop)
   ├── addNewPinnedNote(slug) - adds to localStorage
   ├── router.push(`/${slug}`) - navigates to new note
   │   └── Sidebar selection updates automatically via pathname
   │
5. Post-creation flow (Mobile)
   ├── Update localStorage directly (avoids flash)
   └── router.push(`/${slug}`)
   │
6. Convex broadcasts new note to all subscribers
   └── Sidebar automatically shows new note
```

### Note Delete Flow

```
1. User clicks delete in context menu or presses 'D'
   │
2. handleNoteDelete() in sidebar.tsx
   ├── Check if note is public (prevent deletion)
   ├── deleteNoteMutation({ slug, sessionId })
   │
3. Convex processes deletion
   ├── Removes note from database
   └── Broadcasts change to all subscribers
   │
4. Navigate to next note
   ├── router.push to next note (or /about-me)
   │
5. All subscribers automatically update
   └── Note disappears from sidebar
```

## Session Management

### Session ID Generation & Storage

```typescript
// components/session-id.tsx
useEffect(() => {
  const currentSessionId = localStorage.getItem("session_id") || uuidv4();
  if (!localStorage.getItem("session_id")) {
    localStorage.setItem("session_id", currentSessionId);
  }
  setSessionId(currentSessionId);
}, [setSessionId]);
```

**Storage Location**: `localStorage.session_id`

**Scope**: Browser-specific (not shared across devices/browsers)

**Lifecycle**: Persists until user clears browser data

### Session Notes Context

```typescript
// app/notes/session-notes.tsx
export function SessionNotesProvider({ children }) {
  const [sessionId, setSessionId] = useState<string>("");

  // Convex reactive query - automatically updates
  const sessionNotes = useQuery(
    api.notes.getSessionNotes,
    sessionId ? { sessionId } : "skip"
  );

  // No manual refresh needed - Convex handles it
  const refreshSessionNotes = useCallback(async () => {
    // No-op: Convex queries are reactive
  }, []);

  return (
    <SessionNotesContext.Provider value={{
      sessionId,
      notes: sessionNotes ?? [],
      setSessionId,
      refreshSessionNotes,
    }}>
      {children}
    </SessionNotesContext.Provider>
  );
}
```

### Security Model

- **Public notes** (`public = true`): Anyone can view
- **Private notes** (`public = false`): Only session owner can view/edit
- **Updates/deletes**: Convex functions verify `sessionId` ownership
- **No cross-session access**: Enforced at the database level

## Note Pinning System

The app implements a sophisticated per-user pinning system using localStorage:

### Pinning Data Stores

```typescript
// localStorage keys
pinnedNotes: string[]        // Slugs of notes the user has pinned
unpinnedPublicNotes: string[] // Slugs of public notes the user has unpinned
```

### Pinning Logic

```typescript
// Determine if a note appears in "Pinned" section
const isNotePinned = (note: Note) => {
  // Check if user explicitly unpinned this public note
  const isExplicitlyUnpinned =
    note.public && note.pinned === true && unpinnedPublicNotes.has(note.slug);

  // Note is pinned if:
  // 1. Not explicitly unpinned AND
  // 2. Either admin-pinned (note.pinned) OR user-pinned (in pinnedNotes)
  return (
    !isExplicitlyUnpinned &&
    (note.pinned === true || pinnedNotes.has(note.slug))
  );
};
```

### Pin Toggle Behavior

| Note Type           | Action | Result                             |
| ------------------- | ------ | ---------------------------------- |
| User's private note | Pin    | Added to `pinnedNotes`             |
| User's private note | Unpin  | Removed from `pinnedNotes`         |
| Public admin-pinned | Unpin  | Added to `unpinnedPublicNotes`     |
| Public admin-pinned | Re-pin | Removed from `unpinnedPublicNotes` |

This allows users to customize their view without affecting other users.

## Real-Time Updates

### How Convex Reactivity Works

1. **Subscription**: `useQuery` creates a WebSocket subscription to Convex
2. **Mutation**: When data changes via `useMutation`, Convex updates the database
3. **Broadcast**: Convex identifies all affected queries and pushes updates
4. **Re-render**: React components using those queries automatically re-render

### Benefits Over Previous Architecture (Supabase + ISR)

| Aspect           | Old (Supabase)                | New (Convex)        |
| ---------------- | ----------------------------- | ------------------- |
| Data freshness   | Cached 24 hours               | Real-time           |
| Manual refresh   | Required (`router.refresh()`) | Not needed          |
| Multiple queries | Fetch on every action         | Single subscription |
| Code complexity  | Multiple refresh calls        | Automatic           |
| User experience  | Stale data possible           | Always current      |

### No More Required

The following patterns from the Supabase architecture are **no longer needed**:

- `router.refresh()` - Convex handles updates automatically
- `refreshSessionNotes()` - Now a no-op for API compatibility
- `revalidatePath()` - No server-side caching to invalidate
- ISR configuration - All data is client-fetched

## Design System

The app uses a "Liquid Glass" design system inspired by macOS Sequoia / iOS 26:

### Color Palette

| Element              | Light Mode | Dark Mode |
| -------------------- | ---------- | --------- |
| Note background      | `#FFFFFF`  | `#1E1E1E` |
| Sidebar background   | `#FFFFFF`  | `#202121` |
| Dialogs/menus        | `#FFFFFF`  | `#323232` |
| Selected note        | `#FFE391`  | `#464646` |
| Accent (focus rings) | `#FFD60A`  | `#FFD60A` |

### CSS Utilities

```css
.liquid-transition {
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
}

.glass-float {
  /* For menus and dialogs */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);
}
```

## Attribution

This project is built on top of [Alana Goyal's Apple Notes-inspired personal website](https://github.com/alanagoyal/alanagoyal). Key changes from the original:

- **Backend**: Migrated from Supabase to Convex
- **Framework**: Upgraded to Next.js 16
- **Design**: Updated theme to match macOS Sequoia / iOS 26
- **Pinning**: Added per-user pinning preferences via localStorage
- **Linting**: Using Ultracite (Biome) for code quality
