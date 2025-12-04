import type { Note } from "./types";

// Pre-calculated date boundaries for categorization
type DateBoundaries = {
  today: Date;
  yesterday: Date;
  sevenDaysAgo: Date;
  thirtyDaysAgo: Date;
};

// Calculate date boundaries once
function calculateDateBoundaries(): DateBoundaries {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return { today, yesterday, sevenDaysAgo, thirtyDaysAgo };
}

// Determine the category for a private note based on creation time
function getCategoryByDate(createdDate: Date, bounds: DateBoundaries): string {
  if (createdDate.toDateString() === bounds.today.toDateString()) {
    return "today";
  }
  if (createdDate.toDateString() === bounds.yesterday.toDateString()) {
    return "yesterday";
  }
  if (createdDate > bounds.sevenDaysAgo) {
    return "7";
  }
  if (createdDate > bounds.thirtyDaysAgo) {
    return "30";
  }
  return "older";
}

export function groupNotesByCategory(notes: Note[], pinnedNotes: Set<string>) {
  const groupedNotes: Record<string, Note[]> = {
    pinned: [],
  };

  const dateBounds = calculateDateBoundaries();

  for (const note of notes) {
    // Admin-pinned notes or user-pinned notes go to pinned category
    if (note.pinned === true || pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      continue;
    }

    // Determine category
    let category = note.category;
    if (!note.public) {
      const createdDate = new Date(note._creationTime);
      category = getCategoryByDate(createdDate, dateBounds);
    }

    const cat = category ?? "older";
    if (!groupedNotes[cat]) {
      groupedNotes[cat] = [];
    }
    groupedNotes[cat].push(note);
  }

  return groupedNotes;
}

export function sortGroupedNotes(groupedNotes: Record<string, Note[]>) {
  for (const category of Object.keys(groupedNotes)) {
    groupedNotes[category].sort(
      (a: Note, b: Note) => b._creationTime - a._creationTime
    );
  }
}

// Simple hash function to convert string to number
// Uses bitwise operators intentionally for 32-bit integer conversion
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // biome-ignore lint/suspicious/noBitwiseOperators: Intentional bit shifting for hash calculation
    hash = (hash << 5) - hash + char;
    // biome-ignore lint/suspicious/noBitwiseOperators: Intentional conversion to 32-bit integer
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded random function
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
}

export function getDisplayDateByCategory(
  category: string | undefined,
  noteId: string
): Date {
  const today = new Date();

  switch (category) {
    case "today": {
      const todayDate = new Date(today);
      // Random time between 8:00 AM and current time
      const timeSeedToday = simpleHash(`${noteId}todayTime`);
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();

      // If it's before 8 AM, use 8 AM as max time, otherwise use current time
      const maxTotalMinutes =
        currentHour < 8
          ? 8 * 60 // 8:00 AM in minutes
          : currentHour * 60 + currentMinute;
      const minTotalMinutes = 8 * 60; // 8:00 AM in minutes

      const randomTotalMinutes =
        Math.floor(
          seededRandom(timeSeedToday) * (maxTotalMinutes - minTotalMinutes)
        ) + minTotalMinutes;
      const randomHour = Math.floor(randomTotalMinutes / 60);
      const randomMinute = randomTotalMinutes % 60;

      todayDate.setHours(randomHour, randomMinute, 0, 0);
      return todayDate;
    }

    case "yesterday": {
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeedYesterday = simpleHash(`${noteId}yesterdayTime`);
      const minMinutes = 8 * 60; // 8:00 AM in minutes
      const maxMinutes = 23 * 60; // 11:00 PM in minutes
      const randomMinutesYesterday =
        Math.floor(
          seededRandom(timeSeedYesterday) * (maxMinutes - minMinutes)
        ) + minMinutes;
      const hourYesterday = Math.floor(randomMinutesYesterday / 60);
      const minuteYesterday = randomMinutesYesterday % 60;

      yesterdayDate.setHours(hourYesterday, minuteYesterday, 0, 0);
      return yesterdayDate;
    }

    case "7": {
      // Deterministic "random" date 2-7 days ago based on note ID
      const seed7 = simpleHash(`${noteId}7days`);
      const daysAgo7 = Math.floor(seededRandom(seed7) * 6) + 2; // Between 2-7
      const date7 = new Date(today);
      date7.setDate(date7.getDate() - daysAgo7);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeed7 = simpleHash(`${noteId}7daysTime`);
      const randomMinutes7 =
        Math.floor(seededRandom(timeSeed7) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hour7 = Math.floor(randomMinutes7 / 60);
      const minute7 = randomMinutes7 % 60;

      date7.setHours(hour7, minute7, 0, 0);
      return date7;
    }

    case "30": {
      // Deterministic "random" date 8-30 days ago based on note ID
      const seed30 = simpleHash(`${noteId}30days`);
      const daysAgo30 = Math.floor(seededRandom(seed30) * 23) + 8; // Between 8-30
      const date30 = new Date(today);
      date30.setDate(date30.getDate() - daysAgo30);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeed30 = simpleHash(`${noteId}30daysTime`);
      const randomMinutes30 =
        Math.floor(seededRandom(timeSeed30) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hour30 = Math.floor(randomMinutes30 / 60);
      const minute30 = randomMinutes30 % 60;

      date30.setHours(hour30, minute30, 0, 0);
      return date30;
    }

    case "older": {
      // Deterministic "random" date 31-365 days ago based on note ID
      const seedOlder = simpleHash(`${noteId}older`);
      const daysAgoOlder = Math.floor(seededRandom(seedOlder) * 335) + 31; // Between 31-365
      const dateOlder = new Date(today);
      dateOlder.setDate(dateOlder.getDate() - daysAgoOlder);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeedOlder = simpleHash(`${noteId}olderTime`);
      const randomMinutesOlder =
        Math.floor(seededRandom(timeSeedOlder) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hourOlder = Math.floor(randomMinutesOlder / 60);
      const minuteOlder = randomMinutesOlder % 60;

      dateOlder.setHours(hourOlder, minuteOlder, 0, 0);
      return dateOlder;
    }

    default: {
      // Fallback to today if category is undefined or unknown
      const fallbackDate = new Date(today);
      fallbackDate.setHours(12, 0, 0, 0); // Set to noon as a neutral time
      return fallbackDate;
    }
  }
}
