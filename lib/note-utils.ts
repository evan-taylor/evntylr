import type { Note } from "./types";

// Get the effective timestamp for a note (last edited time)
export function getNoteEffectiveTimestamp(note: Note): number {
  return note.updatedAt ?? note._creationTime;
}

// Get the display date for a note (as a Date object)
export function getNoteDisplayDate(note: Note): Date {
  return new Date(getNoteEffectiveTimestamp(note));
}

// Calculate the number of days between two dates (normalized to start of day)
function getDaysDifference(date: Date, today: Date): number {
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const diffTime = startOfToday.getTime() - startOfDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Determine the category for a note based on its effective timestamp
function getCategoryByDate(noteDate: Date, today: Date): string {
  const daysDiff = getDaysDifference(noteDate, today);
  const noteYear = noteDate.getFullYear();
  const currentYear = today.getFullYear();

  if (daysDiff === 0) {
    return "today";
  }
  if (daysDiff === 1) {
    return "yesterday";
  }
  if (daysDiff >= 2 && daysDiff <= 7) {
    return "previous-7-days";
  }
  if (daysDiff >= 8 && daysDiff <= 30) {
    return "previous-30-days";
  }
  if (noteYear === currentYear) {
    const month = String(noteDate.getMonth() + 1).padStart(2, "0");
    return `month-${noteYear}-${month}`;
  }
  return `year-${noteYear}`;
}

export function groupNotesByCategory(
  notes: Note[],
  pinnedNotes: Set<string>,
  unpinnedPublicNotes: Set<string> = new Set()
) {
  const groupedNotes: Record<string, Note[]> = {
    pinned: [],
  };

  const today = new Date();

  for (const note of notes) {
    // Check if user has explicitly unpinned this public note
    const isExplicitlyUnpinned =
      note.public && note.pinned === true && unpinnedPublicNotes.has(note.slug);

    // Admin-pinned notes (unless explicitly unpinned) or user-pinned notes go to pinned category
    if (
      !isExplicitlyUnpinned &&
      (note.pinned === true || pinnedNotes.has(note.slug))
    ) {
      groupedNotes.pinned.push(note);
      continue;
    }

    // Determine category based on the note's effective timestamp (updatedAt or _creationTime)
    const noteDate = getNoteDisplayDate(note);
    const category = getCategoryByDate(noteDate, today);

    if (!groupedNotes[category]) {
      groupedNotes[category] = [];
    }
    groupedNotes[category].push(note);
  }

  return groupedNotes;
}

export function sortGroupedNotes(groupedNotes: Record<string, Note[]>) {
  for (const category of Object.keys(groupedNotes)) {
    if (category === "pinned") {
      // Sort pinned notes by pinOrder (lower = higher priority), then by updatedAt
      groupedNotes[category].sort((a: Note, b: Note) => {
        const orderA = a.pinOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.pinOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const timeA = a.updatedAt ?? a._creationTime;
        const timeB = b.updatedAt ?? b._creationTime;
        return timeB - timeA;
      });
    } else {
      // Sort other categories by updatedAt (newest first), falling back to creation time
      groupedNotes[category].sort((a: Note, b: Note) => {
        const timeA = a.updatedAt ?? a._creationTime;
        const timeB = b.updatedAt ?? b._creationTime;
        return timeB - timeA;
      });
    }
  }
}

// Month names for labels
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Base category order (fixed categories that always come first if they exist)
const BASE_CATEGORIES = [
  "pinned",
  "today",
  "yesterday",
  "previous-7-days",
  "previous-30-days",
];

// Base labels for fixed categories
const BASE_LABELS: Record<string, string> = {
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  "previous-7-days": "Previous 7 Days",
  "previous-30-days": "Previous 30 Days",
};

// Sort month categories by year and month descending (most recent first)
function sortMonthCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const [, yearA, monthA] = a.split("-");
    const [, yearB, monthB] = b.split("-");
    const yearDiff = Number(yearB) - Number(yearA);
    if (yearDiff !== 0) {
      return yearDiff;
    }
    return Number(monthB) - Number(monthA);
  });
}

// Sort year categories descending (most recent first)
function sortYearCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const yearA = Number(a.split("-")[1]);
    const yearB = Number(b.split("-")[1]);
    return yearB - yearA;
  });
}

// Collect month and year categories from grouped notes
function collectDynamicCategories(groupedNotes: Record<string, Note[]>): {
  monthCategories: string[];
  yearCategories: string[];
} {
  const monthCategories: string[] = [];
  const yearCategories: string[] = [];

  for (const key of Object.keys(groupedNotes)) {
    if (key.startsWith("month-")) {
      monthCategories.push(key);
    } else if (key.startsWith("year-")) {
      yearCategories.push(key);
    }
  }

  return { monthCategories, yearCategories };
}

// Generate dynamic category order and labels based on grouped notes
export function getDynamicCategoryInfo(groupedNotes: Record<string, Note[]>): {
  categoryOrder: string[];
  labels: Record<string, string>;
} {
  const categoryOrder: string[] = [];
  const labels: Record<string, string> = { ...BASE_LABELS };

  // Add base categories that exist in groupedNotes
  for (const cat of BASE_CATEGORIES) {
    if (groupedNotes[cat] && groupedNotes[cat].length > 0) {
      categoryOrder.push(cat);
    }
  }

  // Collect and sort dynamic categories
  const { monthCategories, yearCategories } =
    collectDynamicCategories(groupedNotes);
  const sortedMonths = sortMonthCategories(monthCategories);
  const sortedYears = sortYearCategories(yearCategories);

  // Add month categories with labels
  for (const monthCat of sortedMonths) {
    categoryOrder.push(monthCat);
    const [, , monthStr] = monthCat.split("-");
    const monthIndex = Number(monthStr) - 1;
    labels[monthCat] = MONTH_NAMES[monthIndex];
  }

  // Add year categories with labels
  for (const yearCat of sortedYears) {
    categoryOrder.push(yearCat);
    const year = yearCat.split("-")[1];
    labels[yearCat] = year;
  }

  return { categoryOrder, labels };
}
