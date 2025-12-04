# [notes](https://evntylr.com/notes)

a notes-inspired website that doubles as my personal site. inspired by apple notes.

## how it works

### architecture

the app uses a session-based architecture with two types of notes:

**public notes**: viewable by everyone, managed by the site owner. these appear on the public site and in the sidebar for all visitors.

**private notes**: anyone can create and view their own private notes. each browser session gets a unique session id (stored in localstorage) that links to the notes you create. only you can see and edit your private notes.

**pinned notes**: admin-pinned notes appear for all users in the sidebar, separate from public notes.

the app is built with:

- **next.js 16** with app router for server-side rendering and static generation
- **react 19** with the latest features
- **typescript** for type safety
- **convex** for real-time database and backend
- **react-markdown** with github flavored markdown support
- **tailwind css** for styling

### backend

the app uses [convex](https://convex.dev) as a real-time serverless backend. convex provides:

- real-time data sync across all clients
- automatic caching and optimistic updates
- type-safe queries and mutations
- built-in indexing for fast lookups

**database schema**:

the `notes` table stores all notes with these fields:

- `_id` (convex id): unique identifier (auto-generated)
- `_creationTime` (number): timestamp when note was created (auto-generated)
- `slug` (string): url-friendly identifier
- `title` (string, optional): note title
- `content` (string, optional): markdown content
- `emoji` (string, optional): note icon
- `public` (boolean): controls visibility
- `sessionId` (string, optional): links notes to browser sessions
- `category` (string, optional): categorization (e.g., "today", "favorites")
- `pinned` (boolean, optional): admin-pinned notes shown to all users

**indexes**:

- `by_slug`: fast lookup by url slug
- `by_session`: get all notes for a session
- `by_public`: filter public/private notes

### real-time updates

convex provides automatic real-time synchronization. when you edit a note, all connected clients see the changes instantly—no manual revalidation or caching configuration needed.

## set up the database

this project uses [convex](https://convex.dev) as a backend. to set up:

1. create a convex account at [convex.dev](https://convex.dev)
2. install the convex cli: `npm install convex`
3. run `npx convex dev` to initialize your project and deploy functions
4. the cli will prompt you to create a new project or link to an existing one

grab the deployment url and add it to a new `.env.local` file in the root directory:

```
NEXT_PUBLIC_CONVEX_URL="<your-convex-deployment-url>"
```

## install dependencies

`npm install`

## run the app

run the application in the command line and it will be available at http://localhost:3000.

`npm run dev`

this starts both the next.js dev server and convex dev server concurrently.

## deploy

deploy using [vercel](https://vercel.com):

1. connect your github repository to vercel
2. add the `NEXT_PUBLIC_CONVEX_URL` environment variable
3. deploy!

for convex, run `npm run convex:deploy` to deploy your functions to production.

## markdown syntax for notes

notes support github flavored markdown (gfm) with interactive features. here's what you can use:

### headings

```markdown
# heading 1

## heading 2

### heading 3
```

### text formatting

```markdown
**bold text**
_italic text_
~~strikethrough~~
`inline code`
```

### lists

**unordered lists**:

```markdown
- item one
- item two
  - nested item
  - another nested item
```

**ordered lists**:

```markdown
1. first item
2. second item
3. third item
```

### task lists (interactive)

task lists are interactive - click checkboxes to toggle completion:

```markdown
- [ ] task to do
- [x] completed task
- [ ] another task
```

the app automatically updates the markdown when you click checkboxes, so your progress is saved.

### tables

create tables using standard markdown table syntax. tables render with a styled dark theme:

```markdown
| book             | author              | year read |
| ---------------- | ------------------- | --------- |
| the great gatsby | f. scott fitzgerald | 2023      |
| 1984             | george orwell       | 2024      |
```

this renders as:

| book             | author              | year read |
| ---------------- | ------------------- | --------- |
| the great gatsby | f. scott fitzgerald | 2023      |
| 1984             | george orwell       | 2024      |

**table features**:

- white borders on dark background
- properly padded cells
- header row styling
- responsive layout
- supports links in cells

### links

```markdown
[link text](https://example.com)
```

all links automatically open in new tabs for better navigation.

### code blocks

**inline code**: use backticks for `inline code`

**code blocks**: use triple backticks for multi-line code

````markdown
```javascript
function hello() {
  console.log("hello world");
}
```
````

### blockquotes

```markdown
> this is a blockquote
> it can span multiple lines
```

### images

paste images directly into notes by copying any image (screenshot, file, etc.) and pressing `ctrl+v` (or `cmd+v` on mac). images are automatically uploaded to convex file storage and inserted as markdown.

you can also manually add images:

```markdown
![alt text](image-url.jpg)
```

**supported formats**: jpeg, png, gif, webp (including animated gifs)
**file size limit**: 5mb (larger images are automatically compressed)
**images are automatically resized** to fit the note width while maintaining aspect ratio

### horizontal rules

```markdown
---

``
```
