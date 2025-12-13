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

export interface UseSentenceManagementOptions {
  lesson: Lesson | null;
  lessonId: string | null;
  sentences: PracticeEntry[];
  sentenceCount: number;
  ensureEditable: () => boolean;
  setLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  setActionError: (error: string | null) => void;
  // For cleaning up audio voice state when deleting
  setSentenceAudioVoices: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

export interface UseSentenceManagementReturn {
  // Dialog state
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;

  // Loading states
  isAddingSentence: boolean;
  deletingSentenceId: string | null;
  updatingSentenceId: string | null;
  isSavingSentenceOrder: boolean;

  // Dialog handlers
  handleOpenAddDialog: () => void;
  handleCloseAddDialog: () => void;

  // CRUD operations
  handleAddSentence: (payload: {
    pinyin: string;
    english: string;
    insertPosition: number;
  }) => Promise<void>;
  handleDeleteSentence: (sentenceId: string) => Promise<void>;
  handleUpdateSentence: (
    sentenceId: string,
    payload: { pinyin: string; english: string }
  ) => Promise<void>;

  // Reordering
  handleSentenceDragEnd: (event: DragEndEvent) => void;
}

export function useSentenceManagement(
  options: UseSentenceManagementOptions
): UseSentenceManagementReturn {
  const {
    lesson,
    lessonId,
    sentences,
    sentenceCount,
    ensureEditable,
    setLesson,
    setActionError,
    setSentenceAudioVoices,
  } = options;

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Loading states
  const [isAddingSentence, setIsAddingSentence] = useState(false);
  const [deletingSentenceId, setDeletingSentenceId] = useState<string | null>(
    null
  );
  const [updatingSentenceId, setUpdatingSentenceId] = useState<string | null>(
    null
  );
  const [isSavingSentenceOrder, setIsSavingSentenceOrder] = useState(false);

  // Dialog handlers
  const handleOpenAddDialog = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    if (isAddingSentence) {
      return;
    }
    setIsAddDialogOpen(false);
  }, [isAddingSentence]);

  // Save sentence order to backend
  const saveSentenceOrder = useCallback(
    async (orderedIds: string[], previousOrderIds: string[]) => {
      if (!lessonId) {
        setActionError("Lesson id missing");
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: applyPracticeOrder(prev.sentences, previousOrderIds),
          };
        });
        return;
      }

      if (!ensureEditable()) {
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: applyPracticeOrder(prev.sentences, previousOrderIds),
          };
        });
        return;
      }

      setActionError(null);
      setIsSavingSentenceOrder(true);

      const revertOrder = () => {
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: applyPracticeOrder(prev.sentences, previousOrderIds),
          };
        });
      };

      try {
        const response = await fetch("/api/sentences/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
            sentenceOrder: orderedIds,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save sentence order");
        }
      } catch (err) {
        console.error("Failed to save sentence order", err);
        revertOrder();
        setActionError(
          (err as Error).message || "Failed to save sentence order"
        );
      } finally {
        setIsSavingSentenceOrder(false);
      }
    },
    [ensureEditable, lessonId, setActionError, setLesson]
  );

  // Add a new sentence
  const handleAddSentence = useCallback(
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
        sentenceCount
      );

      setActionError(null);
      setIsAddingSentence(true);

      try {
        const response = await fetch("/api/sentences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
            pinyin,
            english,
            insertPosition: boundedPosition,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to add sentence");
        }

        const createdSentence = await response.json();

        setLesson((prev) => {
          if (!prev) return prev;
          const updatedSentences = [...prev.sentences];
          updatedSentences.splice(boundedPosition, 0, {
            id: createdSentence.id,
            pinyin: createdSentence.pinyin,
            english: createdSentence.english,
            audioUrl: createdSentence.audioUrl ?? null,
          });
          return {
            ...prev,
            sentences: updatedSentences,
          };
        });

        setIsAddDialogOpen(false);
      } catch (err) {
        console.error("Failed to add sentence", err);
        setActionError((err as Error).message || "Failed to add sentence");
      } finally {
        setIsAddingSentence(false);
      }
    },
    [ensureEditable, lessonId, sentenceCount, setActionError, setLesson]
  );

  // Update an existing sentence
  const handleUpdateSentence = useCallback(
    async (
      sentenceId: string,
      payload: { pinyin: string; english: string }
    ) => {
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
      setUpdatingSentenceId(sentenceId);

      try {
        const response = await fetch(`/api/sentences/${sentenceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pinyin, english }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update sentence");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: prev.sentences.map((entry) =>
              entry.id === sentenceId ? { ...entry, pinyin, english } : entry
            ),
          };
        });
      } catch (err) {
        console.error("Failed to update sentence", err);
        setActionError((err as Error).message || "Failed to update sentence");
      } finally {
        setUpdatingSentenceId(null);
      }
    },
    [ensureEditable, setActionError, setLesson]
  );

  // Delete a sentence
  const handleDeleteSentence = useCallback(
    async (sentenceId: string) => {
      if (!ensureEditable()) {
        return;
      }
      setActionError(null);
      setDeletingSentenceId(sentenceId);
      try {
        const response = await fetch(`/api/sentences/${sentenceId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete sentence");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: prev.sentences.filter(
              (sentence) => sentence.id !== sentenceId
            ),
          };
        });
        setSentenceAudioVoices((prev) => omitKey(prev, sentenceId));
      } catch (err) {
        console.error("Failed to delete sentence", err);
        setActionError((err as Error).message || "Failed to delete sentence");
      } finally {
        setDeletingSentenceId(null);
      }
    },
    [ensureEditable, setActionError, setLesson, setSentenceAudioVoices]
  );

  // Handle drag and drop reordering
  const handleSentenceDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!lesson || isSavingSentenceOrder) {
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const currentOrderIds = sentences.map((sentence) => sentence.id);
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
          sentences: applyPracticeOrder(prev.sentences, nextOrderIds),
        };
      });

      saveSentenceOrder(nextOrderIds, previousOrderIds);
    },
    [
      ensureEditable,
      isSavingSentenceOrder,
      lesson,
      saveSentenceOrder,
      sentences,
      setLesson,
    ]
  );

  return {
    // Dialog state
    isAddDialogOpen,
    setIsAddDialogOpen,

    // Loading states
    isAddingSentence,
    deletingSentenceId,
    updatingSentenceId,
    isSavingSentenceOrder,

    // Dialog handlers
    handleOpenAddDialog,
    handleCloseAddDialog,

    // CRUD operations
    handleAddSentence,
    handleDeleteSentence,
    handleUpdateSentence,

    // Reordering
    handleSentenceDragEnd,
  };
}
