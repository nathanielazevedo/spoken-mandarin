import type { PracticeEntry } from "../types/lesson";
import { normalizePinyinWord } from "./pinyin";

/**
 * Reorders entries based on an array of ordered IDs.
 * Entries not in the orderedIds list are appended at the end in their original order.
 */
export const applyPracticeOrder = <T extends PracticeEntry>(
  entries: T[],
  orderedIds: string[]
): T[] => {
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  const ordered: T[] = [];

  orderedIds.forEach((id) => {
    const match = entryMap.get(id);
    if (match) {
      ordered.push(match);
      entryMap.delete(id);
    }
  });

  if (entryMap.size > 0) {
    entries.forEach((entry) => {
      if (entryMap.has(entry.id)) {
        ordered.push(entry);
        entryMap.delete(entry.id);
      }
    });
  }

  return ordered;
};

/**
 * Returns a new object with the specified key removed.
 */
export const omitKey = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return record;
  }
  const next = { ...record };
  delete next[key];
  return next;
};

/**
 * Tokenizes a pinyin string into normalized words.
 */
export const tokenizePinyinWords = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((segment) => normalizePinyinWord(segment))
    .filter((segment): segment is string => Boolean(segment));
