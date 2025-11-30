import type { Lesson } from "../types/lesson";

const LESSON_CACHE_PREFIX = "lesson-cache:v1:";
const LESSON_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface CachedLessonPayload {
  lesson: Lesson;
  timestamp: number;
}

export interface LessonCacheInfo {
  lessonId: string;
  cachedAt: number;
}

const getStorage = (): Storage | null => {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getCacheKey = (lessonId: string) => `${LESSON_CACHE_PREFIX}${lessonId}`;

const readCacheEntry = (
  storage: Storage,
  lessonId: string
): CachedLessonPayload | null => {
  const rawValue = storage.getItem(getCacheKey(lessonId));
  if (!rawValue) {
    return null;
  }

  try {
    const payload = JSON.parse(rawValue) as CachedLessonPayload;
    if (!payload?.lesson || !payload.timestamp) {
      storage.removeItem(getCacheKey(lessonId));
      return null;
    }

    if (Date.now() - payload.timestamp > LESSON_CACHE_TTL_MS) {
      storage.removeItem(getCacheKey(lessonId));
      return null;
    }

    return payload;
  } catch {
    storage.removeItem(getCacheKey(lessonId));
    return null;
  }
};

export const saveLessonToCache = (lesson: Lesson): void => {
  if (!lesson?.id) {
    return;
  }
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const payload: CachedLessonPayload = {
    lesson,
    timestamp: Date.now(),
  };
  try {
    storage.setItem(getCacheKey(lesson.id), JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
};

export const loadLessonFromCache = (lessonId: string): Lesson | null => {
  if (!lessonId) {
    return null;
  }
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const payload = readCacheEntry(storage, lessonId);
  return payload?.lesson ?? null;
};

export const clearLessonFromCache = (lessonId: string): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(getCacheKey(lessonId));
  } catch {
    // Ignore removal errors
  }
};

export const getLessonCacheInfo = (
  lessonId: string
): LessonCacheInfo | null => {
  if (!lessonId) {
    return null;
  }
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const payload = readCacheEntry(storage, lessonId);
  if (!payload) {
    return null;
  }
  return { lessonId, cachedAt: payload.timestamp };
};

export const getCachedLessons = (): LessonCacheInfo[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const entries: LessonCacheInfo[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(LESSON_CACHE_PREFIX)) {
      continue;
    }
    const lessonId = key.slice(LESSON_CACHE_PREFIX.length);
    if (!lessonId) {
      continue;
    }
    const payload = readCacheEntry(storage, lessonId);
    if (payload) {
      entries.push({ lessonId, cachedAt: payload.timestamp });
    }
  }

  return entries;
};

export const isLessonCached = (lessonId: string): boolean =>
  Boolean(getLessonCacheInfo(lessonId));

export const getCachedLessonIds = (): string[] =>
  getCachedLessons().map((entry) => entry.lessonId);
