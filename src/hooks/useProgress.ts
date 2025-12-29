import { useState, useEffect, useCallback } from 'react';

interface UnlockedStatus {
  completedLessons: string[];
  unlockedLessons: string[];
  unlockedUnits: string[];
  unlockedLevels: string[];
}

export function useProgress() {
  const [unlockedStatus, setUnlockedStatus] = useState<UnlockedStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnlockedStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress/unlocked');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in - everything is locked except first items
          setUnlockedStatus({
            completedLessons: [],
            unlockedLessons: [],
            unlockedUnits: [],
            unlockedLevels: [],
          });
          return;
        }
        throw new Error('Failed to fetch progress');
      }
      
      const data = await response.json();
      setUnlockedStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnlockedStatus();
  }, [fetchUnlockedStatus]);

  const isLessonUnlocked = useCallback((lessonId: string) => {
    if (!unlockedStatus) return false;
    return unlockedStatus.unlockedLessons.includes(lessonId);
  }, [unlockedStatus]);

  const isLessonCompleted = useCallback((lessonId: string) => {
    if (!unlockedStatus) return false;
    return unlockedStatus.completedLessons.includes(lessonId);
  }, [unlockedStatus]);

  const isUnitUnlocked = useCallback((unitId: string) => {
    if (!unlockedStatus) return false;
    return unlockedStatus.unlockedUnits.includes(unitId);
  }, [unlockedStatus]);

  const isLevelUnlocked = useCallback((levelId: string) => {
    if (!unlockedStatus) return false;
    return unlockedStatus.unlockedLevels.includes(levelId);
  }, [unlockedStatus]);

  return {
    unlockedStatus,
    loading,
    error,
    isLessonUnlocked,
    isLessonCompleted,
    isUnitUnlocked,
    isLevelUnlocked,
    refreshProgress: fetchUnlockedStatus,
  };
}
