import type { Lesson } from "../types/lesson";

const LESSON_CACHE_PREFIX = "lesson-cache:v1:";
const LESSON_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface CachedLessonPayload {
  lesson: Lesson;
  timestamp: number;
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
    storage.setItem(
      `${LESSON_CACHE_PREFIX}${lesson.id}`,
      JSON.stringify(payload)
    );
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
  const rawValue = storage.getItem(`${LESSON_CACHE_PREFIX}${lessonId}`);
  if (!rawValue) {
    return null;
  }
  try {
    const payload = JSON.parse(rawValue) as CachedLessonPayload;
    if (!payload?.lesson || !payload.timestamp) {
      storage.removeItem(`${LESSON_CACHE_PREFIX}${lessonId}`);
      return null;
    }
    if (Date.now() - payload.timestamp > LESSON_CACHE_TTL_MS) {
      storage.removeItem(`${LESSON_CACHE_PREFIX}${lessonId}`);
      return null;
    }
    return payload.lesson;
  } catch {
    storage.removeItem(`${LESSON_CACHE_PREFIX}${lessonId}`);
    return null;
  }
};

export const clearLessonFromCache = (lessonId: string): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(`${LESSON_CACHE_PREFIX}${lessonId}`);
  } catch {
    // Ignore removal errors
  }
};
