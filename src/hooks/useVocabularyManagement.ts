import { useCallback, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Lesson, PracticeEntry } from "../types/lesson";

const omitKey = <T,>(record: Record<string, T>, key: string) => {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return record;
  }
  const next = { ...record };
  delete next[key];
  return next;
};

const applyPracticeOrder = <T extends PracticeEntry>(
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

export interface UseVocabularyManagementOptions {
  lesson: Lesson | null;
  lessonId: string | null;
  vocabularyList: PracticeEntry[];
  ensureEditable: () => boolean;
  setLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  setActionError: (error: string | null) => void;
  // For cleaning up generation state when deleting
  setGeneratedSentenceSuggestions: React.Dispatch<
    React.SetStateAction<Record<string, { pinyin: string; english: string }>>
  >;
  setSentenceGenerationErrors: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setGeneratingSentenceIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setSavingSentenceIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setVocabularyAudioVoices: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

export interface UseVocabularyManagementReturn {
  // Dialog state
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  vocabularyDialogDefaults: {
    pinyin?: string;
    english?: string;
    insertPosition?: number;
  } | null;
  setVocabularyDialogDefaults: (
    defaults: { pinyin?: string; english?: string; insertPosition?: number } | null
  ) => void;

  // Loading states
  isAddingWord: boolean;
  deletingWordId: string | null;
  updatingVocabularyId: string | null;
  isSavingVocabularyOrder: boolean;

  // Dialog handlers
  handleOpenAddDialog: () => void;
  handleCloseAddDialog: () => void;
  handleCreateVocabularyFromWord: (word: string) => void;

  // CRUD operations
  handleAddVocabulary: (payload: {
    pinyin: string;
    english: string;
    insertPosition: number;
  }) => Promise<void>;
  handleDeleteVocabulary: (vocabId: string) => Promise<void>;
  handleUpdateVocabulary: (
    vocabId: string,
    payload: { pinyin: string; english: string }
  ) => Promise<void>;

  // Order management
  handleVocabularyDragEnd: (event: DragEndEvent) => void;
  handleMoveVocabularyToEnd: (vocabId: string) => void;
  handleChangeVocabularyOrderPosition: (
    vocabId: string,
    nextPosition: number
  ) => void;
}

export function useVocabularyManagement({
  lesson,
  lessonId,
  vocabularyList,
  ensureEditable,
  setLesson,
  setActionError,
  setGeneratedSentenceSuggestions,
  setSentenceGenerationErrors,
  setGeneratingSentenceIds,
  setSavingSentenceIds,
  setVocabularyAudioVoices,
}: UseVocabularyManagementOptions): UseVocabularyManagementReturn {
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [vocabularyDialogDefaults, setVocabularyDialogDefaults] = useState<{
    pinyin?: string;
    english?: string;
    insertPosition?: number;
  } | null>(null);

  // Loading states
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [updatingVocabularyId, setUpdatingVocabularyId] = useState<
    string | null
  >(null);
  const [isSavingVocabularyOrder, setIsSavingVocabularyOrder] = useState(false);

  // Dialog handlers
  const handleOpenAddDialog = useCallback(() => {
    setVocabularyDialogDefaults(null);
    setIsAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    if (isAddingWord) {
      return;
    }
    setIsAddDialogOpen(false);
    setVocabularyDialogDefaults(null);
  }, [isAddingWord]);

  const handleCreateVocabularyFromWord = useCallback(
    (word: string) => {
      const trimmed = word.trim();
      if (!trimmed) {
        return;
      }
      setVocabularyDialogDefaults({
        pinyin: trimmed,
        english: "",
        insertPosition: vocabularyList.length,
      });
      setIsAddDialogOpen(true);
    },
    [vocabularyList.length]
  );

  // Revert vocabulary order helper
  const revertVocabularyOrder = useCallback(
    (previousOrderIds: string[]) => {
      setLesson((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabulary: applyPracticeOrder(prev.vocabulary, previousOrderIds),
        };
      });
    },
    [setLesson]
  );

  // Save vocabulary order to API
  const saveVocabularyOrder = useCallback(
    async (orderedIds: string[], previousOrderIds: string[]) => {
      if (!lessonId) {
        setActionError("Lesson id missing");
        revertVocabularyOrder(previousOrderIds);
        return;
      }

      if (!ensureEditable()) {
        revertVocabularyOrder(previousOrderIds);
        return;
      }

      setActionError(null);
      setIsSavingVocabularyOrder(true);

      try {
        const response = await fetch("/api/vocabulary/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: lessonId,
            vocabularyOrder: orderedIds,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save order");
        }
      } catch (err) {
        console.error("Failed to save vocabulary order", err);
        revertVocabularyOrder(previousOrderIds);
        setActionError((err as Error).message || "Failed to save order");
      } finally {
        setIsSavingVocabularyOrder(false);
      }
    },
    [ensureEditable, revertVocabularyOrder, lessonId, setActionError]
  );

  // Move vocabulary to end via API
  const moveVocabularyToEnd = useCallback(
    async (vocabId: string, previousOrderIds: string[]) => {
      if (!lessonId) {
        setActionError("Lesson id missing");
        revertVocabularyOrder(previousOrderIds);
        return;
      }

      if (!ensureEditable()) {
        revertVocabularyOrder(previousOrderIds);
        return;
      }

      setActionError(null);
      setIsSavingVocabularyOrder(true);

      try {
        const response = await fetch("/api/vocabulary/move-to-end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: lessonId,
            vocabularyId: vocabId,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to move word to end");
        }
      } catch (err) {
        console.error("Failed to move vocabulary to end", err);
        revertVocabularyOrder(previousOrderIds);
        setActionError(
          (err as Error).message || "Failed to move vocabulary to end"
        );
      } finally {
        setIsSavingVocabularyOrder(false);
      }
    },
    [ensureEditable, revertVocabularyOrder, lessonId, setActionError]
  );

  // Delete vocabulary
  const handleDeleteVocabulary = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }
      setActionError(null);
      setDeletingWordId(vocabId);
      try {
        const response = await fetch(`/api/vocabulary/${vocabId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete word");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.filter((v) => v.id !== vocabId),
          };
        });
        setGeneratedSentenceSuggestions((prev) => omitKey(prev, vocabId));
        setSentenceGenerationErrors((prev) => omitKey(prev, vocabId));
        setGeneratingSentenceIds((prev) => omitKey(prev, vocabId));
        setSavingSentenceIds((prev) => omitKey(prev, vocabId));
        setVocabularyAudioVoices((prev) => omitKey(prev, vocabId));
      } catch (err) {
        console.error("Failed to delete vocabulary", err);
        setActionError((err as Error).message || "Failed to delete word");
      } finally {
        setDeletingWordId(null);
      }
    },
    [
      ensureEditable,
      setActionError,
      setLesson,
      setGeneratedSentenceSuggestions,
      setSentenceGenerationErrors,
      setGeneratingSentenceIds,
      setSavingSentenceIds,
      setVocabularyAudioVoices,
    ]
  );

  // Update vocabulary
  const handleUpdateVocabulary = useCallback(
    async (vocabId: string, payload: { pinyin: string; english: string }) => {
      if (!ensureEditable()) {
        return;
      }

      const pinyin = payload.pinyin.trim();
      const english = payload.english.trim();

      if (!pinyin || !english) {
        setActionError("Please provide both pinyin and English");
        return;
      }

      setActionError(null);
      setUpdatingVocabularyId(vocabId);

      try {
        const response = await fetch(`/api/vocabulary/${vocabId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pinyin, english }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update vocabulary");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.map((entry) =>
              entry.id === vocabId ? { ...entry, pinyin, english } : entry
            ),
          };
        });
      } catch (err) {
        console.error("Failed to update vocabulary", err);
        setActionError((err as Error).message || "Failed to update vocabulary");
      } finally {
        setUpdatingVocabularyId(null);
      }
    },
    [ensureEditable, setActionError, setLesson]
  );

  // Add vocabulary
  const handleAddVocabulary = useCallback(
    async (payload: {
      pinyin: string;
      english: string;
      insertPosition: number;
    }) => {
      if (!ensureEditable()) {
        return;
      }
      const pinyin = payload.pinyin.trim();
      const english = payload.english.trim();

      if (!lessonId) {
        setActionError("Lesson id missing");
        return;
      }

      if (!pinyin || !english) {
        setActionError("Please provide both pinyin and English");
        return;
      }

      const boundedPosition = Math.min(
        Math.max(payload.insertPosition, 0),
        vocabularyList.length
      );

      setActionError(null);
      setIsAddingWord(true);

      try {
        const response = await fetch("/api/vocabulary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: lessonId,
            pinyin,
            english,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to add vocabulary");
        }

        const createdWord = await response.json();
        const vocabularyIds = lesson?.vocabulary.map((vocab) => vocab.id) ?? [];
        const desiredOrderIds = [...vocabularyIds];
        desiredOrderIds.splice(boundedPosition, 0, createdWord.id);
        const previousOrderIds = [...vocabularyIds, createdWord.id];

        setLesson((prev) => {
          if (!prev) return prev;
          const nextVocabulary = [...prev.vocabulary];
          nextVocabulary.splice(boundedPosition, 0, {
            id: createdWord.id,
            pinyin: createdWord.pinyin,
            english: createdWord.english,
            hanzi: createdWord.hanzi ?? null,
            audioUrl: createdWord.audioUrl ?? null,
          });
          return {
            ...prev,
            vocabulary: nextVocabulary,
          };
        });

        setIsAddDialogOpen(false);
        setVocabularyDialogDefaults(null);

        const insertedAtEnd = boundedPosition === vocabularyIds.length;
        if (!insertedAtEnd) {
          await saveVocabularyOrder(desiredOrderIds, previousOrderIds);
        }
      } catch (err) {
        console.error("Failed to add vocabulary", err);
        setActionError((err as Error).message || "Failed to add vocabulary");
      } finally {
        setIsAddingWord(false);
      }
    },
    [
      ensureEditable,
      lesson?.vocabulary,
      lessonId,
      saveVocabularyOrder,
      vocabularyList.length,
      setActionError,
      setLesson,
    ]
  );

  // Handle drag end for vocabulary reordering
  const handleVocabularyDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!lesson || isSavingVocabularyOrder) {
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const currentOrderIds = lesson.vocabulary.map((vocab) => vocab.id);
      const fromIndex = currentOrderIds.indexOf(String(active.id));
      const toIndex = currentOrderIds.indexOf(String(over.id));

      if (fromIndex === -1 || toIndex === -1) {
        return;
      }

      const nextOrderIds = arrayMove(currentOrderIds, fromIndex, toIndex);
      const previousOrderIds = [...currentOrderIds];

      setLesson((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabulary: applyPracticeOrder(prev.vocabulary, nextOrderIds),
        };
      });

      saveVocabularyOrder(nextOrderIds, previousOrderIds);
    },
    [ensureEditable, isSavingVocabularyOrder, lesson, saveVocabularyOrder, setLesson]
  );

  // Move vocabulary to end (UI handler)
  const handleMoveVocabularyToEnd = useCallback(
    (vocabId: string) => {
      if (!lesson || isSavingVocabularyOrder) {
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      const currentOrderIds = lesson.vocabulary.map((vocab) => vocab.id);
      const fromIndex = currentOrderIds.indexOf(vocabId);
      const lastIndex = currentOrderIds.length - 1;

      if (fromIndex === -1 || fromIndex === lastIndex) {
        return;
      }

      const previousOrderIds = [...currentOrderIds];
      const nextOrderIds = arrayMove(currentOrderIds, fromIndex, lastIndex);

      setLesson((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabulary: applyPracticeOrder(prev.vocabulary, nextOrderIds),
        };
      });

      moveVocabularyToEnd(vocabId, previousOrderIds);
    },
    [ensureEditable, isSavingVocabularyOrder, lesson, moveVocabularyToEnd, setLesson]
  );

  // Change vocabulary order position
  const handleChangeVocabularyOrderPosition = useCallback(
    (vocabId: string, nextPosition: number) => {
      if (!lesson || isSavingVocabularyOrder || !lesson.vocabulary.length) {
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      const total = lesson.vocabulary.length;
      const targetPosition = Math.min(
        total,
        Math.max(1, Math.floor(nextPosition))
      );

      const currentOrderIds = lesson.vocabulary.map((vocab) => vocab.id);
      const currentIndex = currentOrderIds.indexOf(vocabId);
      const targetIndex = targetPosition - 1;

      if (currentIndex === -1 || currentIndex === targetIndex) {
        return;
      }

      const previousOrderIds = [...currentOrderIds];
      const nextOrderIds = arrayMove(
        currentOrderIds,
        currentIndex,
        targetIndex
      );

      setLesson((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabulary: applyPracticeOrder(prev.vocabulary, nextOrderIds),
        };
      });

      saveVocabularyOrder(nextOrderIds, previousOrderIds);
    },
    [ensureEditable, isSavingVocabularyOrder, lesson, saveVocabularyOrder, setLesson]
  );

  return {
    // Dialog state
    isAddDialogOpen,
    setIsAddDialogOpen,
    vocabularyDialogDefaults,
    setVocabularyDialogDefaults,

    // Loading states
    isAddingWord,
    deletingWordId,
    updatingVocabularyId,
    isSavingVocabularyOrder,

    // Dialog handlers
    handleOpenAddDialog,
    handleCloseAddDialog,
    handleCreateVocabularyFromWord,

    // CRUD operations
    handleAddVocabulary,
    handleDeleteVocabulary,
    handleUpdateVocabulary,

    // Order management
    handleVocabularyDragEnd,
    handleMoveVocabularyToEnd,
    handleChangeVocabularyOrderPosition,
  };
}
