import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Box, Button, CircularProgress, Alert } from "@mui/material";
import type { Lesson, PracticeEntry } from "../types/lesson";
import { Flashcards } from "./Flashcards";
import { VocabularyPractice } from "./VocabularyPractice";
import { LessonHero } from "./lesson/LessonHero";
import { VocabularySection } from "./lesson/VocabularySection";
import { SentenceSection } from "./lesson/SentenceSection";
import { AddVocabularyDialog } from "./lesson/dialogs/AddVocabularyDialog";
import { AddSentenceDialog } from "./lesson/dialogs/AddSentenceDialog";
import { BulkUploadDialog } from "./lesson/dialogs/BulkUploadDialog";
import { normalizePinyinWord } from "../utils/pinyin";
import { isLocalEnvironment } from "../utils/environment";

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

const omitKey = <T,>(record: Record<string, T>, key: string) => {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return record;
  }
  const next = { ...record };
  delete next[key];
  return next;
};

const tokenizePinyinWords = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((segment) => normalizePinyinWord(segment))
    .filter((segment): segment is string => Boolean(segment));

export interface LessonPageProps {
  lessonId: string | null;
  onBack: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({ lessonId, onBack }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddSentenceDialogOpen, setIsAddSentenceDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const [isAddingWord, setIsAddingWord] = useState(false);
  const [isAddingSentence, setIsAddingSentence] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [bulkUploadSuccessMessage, setBulkUploadSuccessMessage] = useState<
    string | null
  >(null);
  const [bulkUploadCounts, setBulkUploadCounts] = useState<{
    vocabulary: number;
    sentences: number;
  } | null>(null);
  const [bulkUploadFilename, setBulkUploadFilename] = useState<string | null>(
    null
  );

  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [deletingSentenceId, setDeletingSentenceId] = useState<string | null>(
    null
  );
  const [generatingVocabularyAudioId, setGeneratingVocabularyAudioId] =
    useState<string | null>(null);
  const [generatingSentenceAudioId, setGeneratingSentenceAudioId] = useState<
    string | null
  >(null);
  const [vocabularyAudioVoices, setVocabularyAudioVoices] = useState<
    Record<string, string>
  >({});
  const [updatingVocabularyId, setUpdatingVocabularyId] = useState<
    string | null
  >(null);
  const [verifyingVocabularyId, setVerifyingVocabularyId] = useState<
    string | null
  >(null);
  const [generatingVocabularyHanziId, setGeneratingVocabularyHanziId] =
    useState<string | null>(null);
  const [vocabularyVerificationResults, setVocabularyVerificationResults] =
    useState<
      Record<
        string,
        {
          status: "success" | "error";
          message: string | null;
        }
      >
    >({});
  const [isGeneratingAllVocabularyAudio, setIsGeneratingAllVocabularyAudio] =
    useState(false);
  const [isGeneratingAllSentenceAudio, setIsGeneratingAllSentenceAudio] =
    useState(false);
  const [isGeneratingAllVocabularyHanzi, setIsGeneratingAllVocabularyHanzi] =
    useState(false);

  const [isSavingVocabularyOrder, setIsSavingVocabularyOrder] = useState(false);
  const [isSavingSentenceOrder, setIsSavingSentenceOrder] = useState(false);

  const [isVocabularyBatchPlaying, setIsVocabularyBatchPlaying] =
    useState(false);
  const [isSentenceBatchPlaying, setIsSentenceBatchPlaying] = useState(false);
  const [currentVocabularyAudioId, setCurrentVocabularyAudioId] = useState<
    string | null
  >(null);
  const [currentSentenceAudioId, setCurrentSentenceAudioId] = useState<
    string | null
  >(null);

  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSentenceFlashcards, setShowSentenceFlashcards] = useState(false);
  const [showVocabularyPractice, setShowVocabularyPractice] = useState(false);
  const [showSentencePractice, setShowSentencePractice] = useState(false);

  const [vocabularySearchTerm, setVocabularySearchTerm] = useState("");
  const [generatedSentenceSuggestions, setGeneratedSentenceSuggestions] =
    useState<Record<string, { pinyin: string; english: string }>>({});
  const [sentenceGenerationErrors, setSentenceGenerationErrors] = useState<
    Record<string, string>
  >({});
  const [generatingSentenceIds, setGeneratingSentenceIds] = useState<
    Record<string, boolean>
  >({});
  const [savingSentenceIds, setSavingSentenceIds] = useState<
    Record<string, boolean>
  >({});
  const [vocabularyDialogDefaults, setVocabularyDialogDefaults] = useState<{
    pinyin?: string;
    english?: string;
    insertPosition?: number;
  } | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const vocabularyList = useMemo(() => lesson?.vocabulary ?? [], [lesson]);
  const sentences = useMemo(() => lesson?.sentences ?? [], [lesson]);
  const sentenceCount = sentences.length;
  const missingVocabularyAudioCount = useMemo(() => {
    return vocabularyList.filter((entry) => !entry.audioUrl).length;
  }, [vocabularyList]);
  const missingVocabularyHanziCount = useMemo(() => {
    return vocabularyList.filter((entry) => !entry.hanzi?.trim()).length;
  }, [vocabularyList]);
  const missingSentenceAudioCount = useMemo(() => {
    return sentences.filter((entry) => !entry.audioUrl).length;
  }, [sentences]);
  const resolvedLessonId = lesson?.id ?? lessonId ?? null;

  const canEditLesson = useMemo(() => isLocalEnvironment(), []);

  const ensureEditable = useCallback(() => {
    if (canEditLesson) {
      return true;
    }
    setActionError("Editing is disabled outside of local development.");
    return false;
  }, [canEditLesson, setActionError]);

  const vocabularyWordSet = useMemo(() => {
    const next = new Set<string>();
    vocabularyList.forEach((entry) => {
      tokenizePinyinWords(entry.pinyin).forEach((word) => next.add(word));
    });
    return next;
  }, [vocabularyList]);

  const vocabularySentenceMatches = useMemo(() => {
    if (!vocabularyList.length || !sentences.length) {
      return {} as Record<string, PracticeEntry[]>;
    }

    const sentenceTokens = sentences.map((sentence) =>
      tokenizePinyinWords(sentence.pinyin)
    );

    const matches: Record<string, PracticeEntry[]> = {};

    vocabularyList.forEach((vocab) => {
      const vocabTokens = tokenizePinyinWords(vocab.pinyin);
      if (!vocabTokens.length) {
        return;
      }

      const matched: PracticeEntry[] = [];
      sentenceTokens.forEach((tokens, index) => {
        if (tokens.some((token) => vocabTokens.includes(token))) {
          matched.push(sentences[index]);
        }
      });

      if (matched.length) {
        matches[vocab.id] = matched;
      }
    });

    return matches;
  }, [sentences, vocabularyList]);

  const { map: vocabularyDuplicateMap, groups: vocabularyDuplicateGroups } =
    useMemo(() => {
      const groups = new Map<string, PracticeEntry[]>();
      vocabularyList.forEach((entry) => {
        const key = normalizePinyinWord(entry.pinyin);
        if (!key) {
          return;
        }
        const existing = groups.get(key);
        if (existing) {
          existing.push(entry);
        } else {
          groups.set(key, [entry]);
        }
      });

      const map: Record<
        string,
        { normalizedKey: string; others: PracticeEntry[] }
      > = {};
      const duplicateGroups: Array<{
        normalizedKey: string;
        entries: PracticeEntry[];
      }> = [];

      groups.forEach((entries, normalizedKey) => {
        if (entries.length <= 1) {
          return;
        }
        duplicateGroups.push({ normalizedKey, entries });
        entries.forEach((entry) => {
          map[entry.id] = {
            normalizedKey,
            others: entries.filter((other) => other.id !== entry.id),
          };
        });
      });

      return { map, groups: duplicateGroups };
    }, [vocabularyList]);

  const handleVocabularySearchChange = useCallback((value: string) => {
    setVocabularySearchTerm(value);
  }, []);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setIsLoading(false);
      setError("Missing lesson id");
      return;
    }

    const controller = new AbortController();

    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lessons/${lessonId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Lesson not found"
              : "Failed to load lesson"
          );
        }

        const data: Lesson = await response.json();
        setLesson(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError((err as Error).message || "Failed to load lesson");
        setLesson(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();

    return () => {
      controller.abort();
    };
  }, [lessonId]);

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

  const handleOpenAddSentenceDialog = useCallback(() => {
    setIsAddSentenceDialogOpen(true);
  }, []);

  const handleCloseAddSentenceDialog = useCallback(() => {
    if (isAddingSentence) {
      return;
    }
    setIsAddSentenceDialogOpen(false);
  }, [isAddingSentence]);

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

  const normalizeBulkEntry = useCallback(
    (entry: unknown, index: number, label: "vocabulary" | "sentences") => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`Invalid ${label} entry at index ${index}.`);
      }
      const record = entry as Record<string, unknown>;
      const pinyin =
        typeof record.pinyin === "string" ? record.pinyin.trim() : "";
      const english =
        typeof record.english === "string" ? record.english.trim() : "";
      const audioUrl =
        typeof record.audioUrl === "string" ? record.audioUrl.trim() : "";

      if (!pinyin || !english) {
        throw new Error(
          `Missing pinyin or english for ${label} entry at index ${index}.`
        );
      }

      return audioUrl ? { pinyin, english, audioUrl } : { pinyin, english };
    },
    []
  );

  const handleOpenBulkUploadDialog = useCallback(() => {
    setBulkUploadError(null);
    setBulkUploadSuccessMessage(null);
    setBulkUploadCounts(null);
    setBulkUploadFilename(null);
    setIsBulkUploadDialogOpen(true);
  }, []);

  const handleCloseBulkUploadDialog = useCallback(() => {
    if (isBulkUploading) {
      return;
    }
    setIsBulkUploadDialogOpen(false);
  }, [isBulkUploading]);

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
    [ensureEditable]
  );

  const handleGenerateVocabularyAudio = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }
      setActionError(null);
      setGeneratingVocabularyAudioId(vocabId);
      try {
        const response = await fetch(`/api/vocabulary/${vocabId}/audio`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate audio");
        }

        const data = await response.json();
        const normalizedVoice =
          typeof data.voice === "string" ? data.voice.trim() : "";
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.map((vocab) =>
              vocab.id === vocabId
                ? { ...vocab, audioUrl: data.audioUrl }
                : vocab
            ),
          };
        });
        setVocabularyAudioVoices((prev) =>
          normalizedVoice
            ? { ...prev, [vocabId]: normalizedVoice }
            : omitKey(prev, vocabId)
        );
      } catch (err) {
        console.error("Failed to generate audio", err);
        setActionError((err as Error).message || "Failed to generate audio");
      } finally {
        setGeneratingVocabularyAudioId(null);
      }
    },
    [ensureEditable]
  );

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
    [ensureEditable]
  );

  const handleGenerateVocabularyHanzi = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }

      setActionError(null);
      setGeneratingVocabularyHanziId(vocabId);

      try {
        const response = await fetch(`/api/vocabulary/${vocabId}/hanzi`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate hanzi");
        }

        const data = await response.json().catch(() => ({}));
        const hanzi = typeof data.hanzi === "string" ? data.hanzi.trim() : "";

        if (!hanzi) {
          throw new Error("Missing hanzi in response");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.map((entry) =>
              entry.id === vocabId ? { ...entry, hanzi } : entry
            ),
          };
        });
      } catch (err) {
        console.error("Failed to generate vocabulary hanzi", err);
        setActionError(
          (err as Error).message || "Failed to generate vocabulary hanzi"
        );
      } finally {
        setGeneratingVocabularyHanziId(null);
      }
    },
    [ensureEditable]
  );

  const handleVerifyVocabularyPinyin = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }

      setActionError(null);
      setVerifyingVocabularyId(vocabId);
      setVocabularyVerificationResults((prev) => {
        const next = { ...prev };
        delete next[vocabId];
        return next;
      });

      try {
        const response = await fetch(
          `/api/vocabulary/${vocabId}/verify-pinyin`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to verify pinyin");
        }

        const data = await response.json().catch(() => ({}));
        const correctedPinyin =
          typeof data.pinyin === "string" ? data.pinyin.trim() : "";
        const correctedHanzi =
          typeof data.hanzi === "string" ? data.hanzi.trim() : "";

        if (!correctedPinyin || !correctedHanzi) {
          throw new Error("Missing pinyin or hanzi in verification response");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.map((entry) =>
              entry.id === vocabId
                ? { ...entry, pinyin: correctedPinyin, hanzi: correctedHanzi }
                : entry
            ),
          };
        });

        const previousPinyin =
          typeof data.previousPinyin === "string"
            ? data.previousPinyin.trim()
            : null;
        const previousHanzi =
          typeof data.previousHanzi === "string"
            ? data.previousHanzi.trim()
            : null;

        const pinyinChanged =
          Boolean(previousPinyin) && previousPinyin !== correctedPinyin;
        const hanziChanged =
          Boolean(previousHanzi) && previousHanzi !== correctedHanzi;

        const fallbackNote = (() => {
          const previousPinyinLabel = previousPinyin ?? "previous";
          if (pinyinChanged && hanziChanged) {
            return `Pinyin ${previousPinyinLabel} → ${correctedPinyin}; hanzi updated`;
          }
          if (pinyinChanged) {
            return `Updated pinyin from ${previousPinyinLabel} to ${correctedPinyin}`;
          }
          if (hanziChanged) {
            return "Hanzi updated";
          }
          return "Pinyin & hanzi verified";
        })();

        const noteText =
          typeof data.notes === "string" && data.notes.trim().length
            ? data.notes.trim()
            : fallbackNote;

        setVocabularyVerificationResults((prev) => ({
          ...prev,
          [vocabId]: { status: "success", message: noteText },
        }));
      } catch (err) {
        console.error("Failed to verify vocabulary pinyin", err);
        setActionError(
          (err as Error).message || "Failed to verify vocabulary pinyin"
        );
        setVocabularyVerificationResults((prev) => ({
          ...prev,
          [vocabId]: {
            status: "error",
            message: (err as Error).message || "Verification failed",
          },
        }));
      } finally {
        setVerifyingVocabularyId(null);
      }
    },
    [ensureEditable]
  );

  const handleGenerateSentenceAudio = useCallback(
    async (sentenceId: string) => {
      if (!ensureEditable()) {
        return;
      }
      setActionError(null);
      setGeneratingSentenceAudioId(sentenceId);
      try {
        const response = await fetch(`/api/sentences/${sentenceId}/audio`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate audio");
        }

        const data = await response.json();
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: prev.sentences.map((sentence) =>
              sentence.id === sentenceId
                ? { ...sentence, audioUrl: data.audioUrl }
                : sentence
            ),
          };
        });
      } catch (err) {
        console.error("Failed to generate sentence audio", err);
        setActionError((err as Error).message || "Failed to generate audio");
      } finally {
        setGeneratingSentenceAudioId(null);
      }
    },
    [ensureEditable]
  );

  const handleGenerateMissingVocabularyHanzi = useCallback(async () => {
    const missingEntries = vocabularyList.filter(
      (entry) => !entry.hanzi?.trim()
    );
    if (!missingEntries.length) {
      return;
    }

    if (!ensureEditable()) {
      return;
    }

    setActionError(null);
    setIsGeneratingAllVocabularyHanzi(true);

    try {
      for (const entry of missingEntries) {
        await handleGenerateVocabularyHanzi(entry.id);
      }
    } finally {
      setIsGeneratingAllVocabularyHanzi(false);
    }
  }, [ensureEditable, handleGenerateVocabularyHanzi, vocabularyList]);

  const handleGenerateMissingVocabularyAudio = useCallback(async () => {
    const missingEntries = vocabularyList.filter((entry) => !entry.audioUrl);
    if (!missingEntries.length) {
      return;
    }

    if (!ensureEditable()) {
      return;
    }

    setActionError(null);
    setIsGeneratingAllVocabularyAudio(true);

    try {
      for (const entry of missingEntries) {
        await handleGenerateVocabularyAudio(entry.id);
      }
    } finally {
      setIsGeneratingAllVocabularyAudio(false);
    }
  }, [ensureEditable, handleGenerateVocabularyAudio, vocabularyList]);

  const handleGenerateMissingSentenceAudio = useCallback(async () => {
    const missingEntries = sentences.filter((entry) => !entry.audioUrl);
    if (!missingEntries.length) {
      return;
    }

    if (!ensureEditable()) {
      return;
    }

    setActionError(null);
    setIsGeneratingAllSentenceAudio(true);

    try {
      for (const entry of missingEntries) {
        await handleGenerateSentenceAudio(entry.id);
      }
    } finally {
      setIsGeneratingAllSentenceAudio(false);
    }
  }, [ensureEditable, handleGenerateSentenceAudio, sentences]);

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
      } catch (err) {
        console.error("Failed to delete sentence", err);
        setActionError((err as Error).message || "Failed to delete sentence");
      } finally {
        setDeletingSentenceId(null);
      }
    },
    [ensureEditable]
  );

  const revertVocabularyOrder = useCallback((previousOrderIds: string[]) => {
    setLesson((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        vocabulary: applyPracticeOrder(prev.vocabulary, previousOrderIds),
      };
    });
  }, []);

  const saveVocabularyOrder = useCallback(
    async (orderedIds: string[], previousOrderIds: string[]) => {
      if (!resolvedLessonId) {
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

      const revertOrder = () => {
        revertVocabularyOrder(previousOrderIds);
      };

      try {
        const response = await fetch("/api/vocabulary/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: resolvedLessonId,
            vocabularyOrder: orderedIds,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save order");
        }
      } catch (err) {
        console.error("Failed to save vocabulary order", err);
        revertOrder();
        setActionError((err as Error).message || "Failed to save order");
      } finally {
        setIsSavingVocabularyOrder(false);
      }
    },
    [ensureEditable, revertVocabularyOrder, resolvedLessonId]
  );

  const moveVocabularyToEnd = useCallback(
    async (vocabId: string, previousOrderIds: string[]) => {
      if (!resolvedLessonId) {
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

      const revertOrder = () => {
        revertVocabularyOrder(previousOrderIds);
      };

      try {
        const response = await fetch("/api/vocabulary/move-to-end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: resolvedLessonId,
            vocabularyId: vocabId,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to move word to end");
        }
      } catch (err) {
        console.error("Failed to move vocabulary to end", err);
        revertOrder();
        setActionError(
          (err as Error).message || "Failed to move vocabulary to end"
        );
      } finally {
        setIsSavingVocabularyOrder(false);
      }
    },
    [ensureEditable, revertVocabularyOrder, resolvedLessonId]
  );

  const saveSentenceOrder = useCallback(
    async (orderedIds: string[], previousOrderIds: string[]) => {
      if (!resolvedLessonId) {
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
            lessonId: resolvedLessonId,
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
    [ensureEditable, resolvedLessonId]
  );

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

      if (!resolvedLessonId) {
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
            lessonId: resolvedLessonId,
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
      resolvedLessonId,
      saveVocabularyOrder,
      vocabularyList.length,
    ]
  );

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

      if (!resolvedLessonId) {
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
            lessonId: resolvedLessonId,
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

        setIsAddSentenceDialogOpen(false);
      } catch (err) {
        console.error("Failed to add sentence", err);
        setActionError((err as Error).message || "Failed to add sentence");
      } finally {
        setIsAddingSentence(false);
      }
    },
    [ensureEditable, resolvedLessonId, sentenceCount]
  );

  const handleBulkUploadContent = useCallback(
    async (rawText: string, sourceLabel: string) => {
      if (!resolvedLessonId) {
        setBulkUploadError("Lesson id missing");
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      setBulkUploadError(null);
      setBulkUploadSuccessMessage(null);
      setBulkUploadCounts(null);
      setBulkUploadFilename(sourceLabel);
      setIsBulkUploading(true);

      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error("JSON content must be valid.");
        }

        if (!parsed || typeof parsed !== "object") {
          throw new Error(
            "JSON must be an object with vocabulary and/or sentences arrays."
          );
        }

        const vocabularyInput = Array.isArray(
          (parsed as { vocabulary?: unknown[] }).vocabulary
        )
          ? (parsed as { vocabulary: unknown[] }).vocabulary ?? []
          : [];
        const sentencesInput = Array.isArray(
          (parsed as { sentences?: unknown[] }).sentences
        )
          ? (parsed as { sentences: unknown[] }).sentences ?? []
          : [];

        if (!vocabularyInput.length && !sentencesInput.length) {
          throw new Error(
            "Include at least one vocabulary or sentence entry in the JSON."
          );
        }

        const normalizedVocabulary = vocabularyInput.map((entry, index) =>
          normalizeBulkEntry(entry, index, "vocabulary")
        );
        const normalizedSentences = sentencesInput.map((entry, index) =>
          normalizeBulkEntry(entry, index, "sentences")
        );

        const response = await fetch(`/api/lessons/${resolvedLessonId}/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabulary: normalizedVocabulary,
            sentences: normalizedSentences,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Bulk upload failed");
        }

        const data = await response.json();
        const createdVocabulary = Array.isArray(data?.created?.vocabulary)
          ? (data.created.vocabulary as Array<{
              id: string;
              pinyin: string;
              english: string;
              audioUrl?: string | null;
            }>)
          : [];
        const createdSentences = Array.isArray(data?.created?.sentences)
          ? (data.created.sentences as Array<{
              id: string;
              pinyin: string;
              english: string;
              audioUrl?: string | null;
            }>)
          : [];

        setLesson((prev) => {
          if (!prev) return prev;

          const nextVocabulary = createdVocabulary.length
            ? [
                ...prev.vocabulary,
                ...createdVocabulary.map((entry) => ({
                  id: entry.id,
                  pinyin: entry.pinyin,
                  english: entry.english,
                  audioUrl: entry.audioUrl ?? undefined,
                })),
              ]
            : prev.vocabulary;

          const nextSentences = createdSentences.length
            ? [
                ...prev.sentences,
                ...createdSentences.map((entry) => ({
                  id: entry.id,
                  pinyin: entry.pinyin,
                  english: entry.english,
                  audioUrl: entry.audioUrl ?? undefined,
                })),
              ]
            : prev.sentences;

          return {
            ...prev,
            vocabulary: nextVocabulary,
            sentences: nextSentences,
          };
        });

        const vocabCount =
          typeof data?.counts?.vocabulary === "number"
            ? data.counts.vocabulary
            : createdVocabulary.length;
        const uploadSentenceCount =
          typeof data?.counts?.sentences === "number"
            ? data.counts.sentences
            : createdSentences.length;

        setBulkUploadCounts({
          vocabulary: vocabCount,
          sentences: uploadSentenceCount,
        });
        setBulkUploadSuccessMessage(
          `Imported ${vocabCount} vocabulary entr${
            vocabCount === 1 ? "y" : "ies"
          } and ${uploadSentenceCount} sentence${
            uploadSentenceCount === 1 ? "" : "s"
          }.`
        );
      } catch (err) {
        console.error("Bulk upload failed", err);
        setBulkUploadError((err as Error).message || "Bulk upload failed");
      } finally {
        setIsBulkUploading(false);
      }
    },
    [ensureEditable, normalizeBulkEntry, resolvedLessonId]
  );

  const handleBulkUploadFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!ensureEditable()) {
        return;
      }
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      const fileText = await file.text();
      handleBulkUploadContent(fileText, file.name);
    },
    [ensureEditable, handleBulkUploadContent]
  );

  const handleBulkUploadJsonPasted = useCallback(
    (jsonText: string) => {
      if (!ensureEditable()) {
        return;
      }
      handleBulkUploadContent(jsonText, "Pasted JSON");
    },
    [ensureEditable, handleBulkUploadContent]
  );

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
    [ensureEditable, isSavingVocabularyOrder, lesson, saveVocabularyOrder]
  );

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
    [ensureEditable, isSavingVocabularyOrder, lesson, moveVocabularyToEnd]
  );

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
    [ensureEditable, isSavingVocabularyOrder, lesson, saveVocabularyOrder]
  );

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
    ]
  );

  const stopCurrentAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      speechUtteranceRef.current
    ) {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    }
  }, []);

  const resetVocabularyPlaybackState = useCallback(() => {
    setIsVocabularyBatchPlaying(false);
    setCurrentVocabularyAudioId(null);
  }, []);

  const resetSentencePlaybackState = useCallback(() => {
    setIsSentenceBatchPlaying(false);
    setCurrentSentenceAudioId(null);
  }, []);

  const stopAllPlayback = useCallback(() => {
    stopCurrentAudio();
    resetVocabularyPlaybackState();
    resetSentencePlaybackState();
  }, [
    resetSentencePlaybackState,
    resetVocabularyPlaybackState,
    stopCurrentAudio,
  ]);

  const handleBackClick = useCallback(() => {
    stopAllPlayback();
    onBack();
  }, [onBack, stopAllPlayback]);

  const playPracticeEntry = useCallback(
    (entry: PracticeEntry, onFinished?: () => void) => {
      const handleDone = () => {
        stopCurrentAudio();
        onFinished?.();
      };

      if (entry.audioUrl) {
        const audio = new Audio(entry.audioUrl);
        audioElementRef.current = audio;
        audio.onended = handleDone;
        audio.onerror = handleDone;
        audio.play().catch(() => {
          handleDone();
        });
        return;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(entry.pinyin);
        speechUtteranceRef.current = utterance;
        utterance.lang = "zh-CN";
        utterance.rate = 0.95;
        utterance.onend = handleDone;
        utterance.onerror = handleDone;
        window.speechSynthesis.speak(utterance);
        return;
      }

      handleDone();
    },
    [stopCurrentAudio]
  );

  const playWordAtIndex = useCallback(
    (index: number) => {
      if (!lesson?.vocabulary[index]) {
        resetVocabularyPlaybackState();
        return;
      }

      const entry = lesson.vocabulary[index];
      setCurrentVocabularyAudioId(entry.id);

      playPracticeEntry(entry, () => playWordAtIndex(index + 1));
    },
    [lesson, playPracticeEntry, resetVocabularyPlaybackState]
  );

  const handlePlayWord = useCallback(
    (vocabId: string) => {
      if (!lesson?.vocabulary.length) {
        return;
      }
      const entry = lesson.vocabulary.find((v) => v.id === vocabId);
      if (!entry) {
        return;
      }
      stopAllPlayback();
      setCurrentVocabularyAudioId(entry.id);
      playPracticeEntry(entry, () => setCurrentVocabularyAudioId(null));
    },
    [lesson, playPracticeEntry, stopAllPlayback]
  );

  const handlePlaySentence = useCallback(
    (sentenceId: string) => {
      const sentence = sentences.find((s) => s.id === sentenceId);
      if (!sentence) {
        return;
      }
      stopAllPlayback();
      setCurrentSentenceAudioId(sentenceId);
      playPracticeEntry(sentence, () => setCurrentSentenceAudioId(null));
    },
    [playPracticeEntry, sentences, stopAllPlayback]
  );

  const handlePracticeEntryCompleted = useCallback(
    (entry: PracticeEntry, proceed: () => void) => {
      stopCurrentAudio();
      playPracticeEntry(entry, proceed);
    },
    [playPracticeEntry, stopCurrentAudio]
  );

  const handleGenerateSentenceSuggestion = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }
      setSentenceGenerationErrors((prev) => omitKey(prev, vocabId));
      setGeneratingSentenceIds((prev) => ({ ...prev, [vocabId]: true }));

      try {
        const response = await fetch(
          `/api/vocabulary/${vocabId}/generate-sentence`,
          {
            method: "POST",
          }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate sentence");
        }

        const pinyin =
          typeof data.pinyin === "string" ? data.pinyin.trim() : "";
        const english =
          typeof data.english === "string" ? data.english.trim() : "";

        if (!pinyin || !english) {
          throw new Error("OpenAI returned an empty sentence");
        }

        setGeneratedSentenceSuggestions((prev) => ({
          ...prev,
          [vocabId]: { pinyin, english },
        }));
      } catch (err) {
        setSentenceGenerationErrors((prev) => ({
          ...prev,
          [vocabId]: (err as Error).message || "Failed to generate sentence",
        }));
      } finally {
        setGeneratingSentenceIds((prev) => omitKey(prev, vocabId));
      }
    },
    [ensureEditable]
  );

  const handleDismissGeneratedSentence = useCallback((vocabId: string) => {
    setGeneratedSentenceSuggestions((prev) => omitKey(prev, vocabId));
    setSentenceGenerationErrors((prev) => omitKey(prev, vocabId));
  }, []);

  const handleSaveGeneratedSentenceSuggestion = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }
      if (!resolvedLessonId) {
        setActionError("Lesson id missing");
        return;
      }

      const suggestion = generatedSentenceSuggestions[vocabId];
      if (!suggestion) {
        setSentenceGenerationErrors((prev) => ({
          ...prev,
          [vocabId]: "No generated sentence to save",
        }));
        return;
      }

      setSentenceGenerationErrors((prev) => omitKey(prev, vocabId));
      setSavingSentenceIds((prev) => ({ ...prev, [vocabId]: true }));

      try {
        const response = await fetch("/api/sentences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: resolvedLessonId,
            pinyin: suggestion.pinyin,
            english: suggestion.english,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to save sentence");
        }

        const createdId = typeof data.id === "string" ? data.id : "";
        const createdPinyin =
          typeof data.pinyin === "string" ? data.pinyin : suggestion.pinyin;
        const createdEnglish =
          typeof data.english === "string" ? data.english : suggestion.english;

        if (!createdId) {
          throw new Error("Sentence response missing id");
        }

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: [
              ...prev.sentences,
              {
                id: createdId,
                pinyin: createdPinyin,
                english: createdEnglish,
                audioUrl: data.audioUrl ?? null,
              },
            ],
          };
        });

        setGeneratedSentenceSuggestions((prev) => omitKey(prev, vocabId));
      } catch (err) {
        setSentenceGenerationErrors((prev) => ({
          ...prev,
          [vocabId]: (err as Error).message || "Failed to save sentence",
        }));
      } finally {
        setSavingSentenceIds((prev) => omitKey(prev, vocabId));
      }
    },
    [ensureEditable, generatedSentenceSuggestions, resolvedLessonId]
  );

  const handleStartVocabularyBatch = useCallback(() => {
    if (!lesson?.vocabulary.length) {
      return;
    }
    stopAllPlayback();
    setIsVocabularyBatchPlaying(true);
    playWordAtIndex(0);
  }, [lesson, playWordAtIndex, stopAllPlayback]);

  const handleVocabularyBatchToggle = useCallback(() => {
    if (isVocabularyBatchPlaying) {
      stopAllPlayback();
    } else {
      handleStartVocabularyBatch();
    }
  }, [handleStartVocabularyBatch, isVocabularyBatchPlaying, stopAllPlayback]);

  const playSentenceAtIndex = useCallback(
    (index: number) => {
      if (!sentences[index]) {
        resetSentencePlaybackState();
        return;
      }

      const entry = sentences[index];
      setCurrentSentenceAudioId(entry.id);
      playPracticeEntry(entry, () => playSentenceAtIndex(index + 1));
    },
    [playPracticeEntry, resetSentencePlaybackState, sentences]
  );

  const handleStartSentenceBatch = useCallback(() => {
    if (!sentences.length) {
      return;
    }
    stopAllPlayback();
    setIsSentenceBatchPlaying(true);
    playSentenceAtIndex(0);
  }, [playSentenceAtIndex, sentences.length, stopAllPlayback]);

  const handleSentenceBatchToggle = useCallback(() => {
    if (isSentenceBatchPlaying) {
      stopAllPlayback();
    } else {
      handleStartSentenceBatch();
    }
  }, [handleStartSentenceBatch, isSentenceBatchPlaying, stopAllPlayback]);

  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  if (isLoading) {
    return (
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 4,
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lesson) {
    return (
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 4,
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: "100%",
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Lesson not found"}
        </Alert>
        <Button variant="contained" onClick={handleBackClick}>
          Back to lessons
        </Button>
      </Box>
    );
  }

  if (showVocabularyPractice) {
    return (
      <VocabularyPractice
        vocabulary={lesson.vocabulary}
        onClose={() => setShowVocabularyPractice(false)}
        onEntryCompleted={handlePracticeEntryCompleted}
      />
    );
  }

  if (showSentencePractice) {
    return (
      <VocabularyPractice
        vocabulary={sentences}
        itemLabel="sentences"
        onClose={() => setShowSentencePractice(false)}
        onEntryCompleted={handlePracticeEntryCompleted}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
        <LessonHero
          title={lesson.title}
          description={``}
          onBackClick={handleBackClick}
          onBulkUploadClick={
            canEditLesson ? handleOpenBulkUploadDialog : undefined
          }
        />

        {actionError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {actionError}
          </Alert>
        )}

        <VocabularySection
          vocabulary={lesson.vocabulary}
          sentenceMatches={vocabularySentenceMatches}
          duplicateVocabularyMap={vocabularyDuplicateMap}
          duplicateVocabularyGroups={vocabularyDuplicateGroups}
          searchTerm={vocabularySearchTerm}
          onSearchTermChange={handleVocabularySearchChange}
          generatedSentenceSuggestions={generatedSentenceSuggestions}
          generatingSentenceIds={generatingSentenceIds}
          savingSentenceIds={savingSentenceIds}
          sentenceGenerationErrors={sentenceGenerationErrors}
          onGenerateSentence={
            canEditLesson ? handleGenerateSentenceSuggestion : undefined
          }
          onSaveGeneratedSentence={
            canEditLesson ? handleSaveGeneratedSentenceSuggestion : undefined
          }
          onDismissGeneratedSentence={
            canEditLesson ? handleDismissGeneratedSentence : undefined
          }
          sensors={sensors}
          onDragEnd={canEditLesson ? handleVocabularyDragEnd : undefined}
          isSavingOrder={isSavingVocabularyOrder}
          isBatchPlaying={isVocabularyBatchPlaying}
          onBatchToggle={handleVocabularyBatchToggle}
          onPracticeClick={() => setShowVocabularyPractice(true)}
          onAddWordClick={canEditLesson ? handleOpenAddDialog : undefined}
          onFlashcardsClick={() => setShowFlashcards(true)}
          currentAudioId={currentVocabularyAudioId}
          deletingWordId={deletingWordId}
          generatingAudioId={generatingVocabularyAudioId}
          missingAudioCount={missingVocabularyAudioCount}
          isGeneratingMissingAudio={isGeneratingAllVocabularyAudio}
          onGenerateMissingAudio={
            canEditLesson ? handleGenerateMissingVocabularyAudio : undefined
          }
          missingHanziCount={missingVocabularyHanziCount}
          isGeneratingMissingHanzi={isGeneratingAllVocabularyHanzi}
          onGenerateMissingHanzi={
            canEditLesson ? handleGenerateMissingVocabularyHanzi : undefined
          }
          audioVoices={vocabularyAudioVoices}
          onPlayWord={handlePlayWord}
          onDeleteWord={canEditLesson ? handleDeleteVocabulary : undefined}
          onRegenerateAudio={
            canEditLesson ? handleGenerateVocabularyAudio : undefined
          }
          onGenerateHanzi={
            canEditLesson ? handleGenerateVocabularyHanzi : undefined
          }
          onMoveWordToEnd={
            canEditLesson ? handleMoveVocabularyToEnd : undefined
          }
          onChangeWordOrder={
            canEditLesson ? handleChangeVocabularyOrderPosition : undefined
          }
          onEditWord={canEditLesson ? handleUpdateVocabulary : undefined}
          onVerifyWord={
            canEditLesson ? handleVerifyVocabularyPinyin : undefined
          }
          updatingWordId={updatingVocabularyId}
          verifyingWordId={verifyingVocabularyId}
          verificationResults={vocabularyVerificationResults}
          generatingHanziId={generatingVocabularyHanziId}
          reorderingEnabled={canEditLesson}
        />

        <SentenceSection
          sentences={sentences}
          vocabularyWordSet={vocabularyWordSet}
          onMissingWordClick={
            canEditLesson ? handleCreateVocabularyFromWord : undefined
          }
          sensors={sensors}
          onDragEnd={canEditLesson ? handleSentenceDragEnd : undefined}
          isSavingOrder={isSavingSentenceOrder}
          isBatchPlaying={isSentenceBatchPlaying}
          onBatchToggle={handleSentenceBatchToggle}
          onPracticeClick={() => setShowSentencePractice(true)}
          onAddSentenceClick={
            canEditLesson ? handleOpenAddSentenceDialog : undefined
          }
          onFlashcardsClick={() => setShowSentenceFlashcards(true)}
          currentSentenceAudioId={currentSentenceAudioId}
          deletingSentenceId={deletingSentenceId}
          generatingSentenceAudioId={generatingSentenceAudioId}
          missingAudioCount={missingSentenceAudioCount}
          isGeneratingMissingAudio={isGeneratingAllSentenceAudio}
          onGenerateMissingAudio={
            canEditLesson ? handleGenerateMissingSentenceAudio : undefined
          }
          onPlaySentence={handlePlaySentence}
          onDeleteSentence={canEditLesson ? handleDeleteSentence : undefined}
          onRegenerateAudio={
            canEditLesson ? handleGenerateSentenceAudio : undefined
          }
          reorderingEnabled={canEditLesson}
        />

        {canEditLesson && (
          <AddVocabularyDialog
            open={isAddDialogOpen}
            isSubmitting={isAddingWord}
            vocabularyList={vocabularyList}
            initialValues={vocabularyDialogDefaults}
            onClose={handleCloseAddDialog}
            onSubmit={handleAddVocabulary}
          />
        )}

        {canEditLesson && (
          <AddSentenceDialog
            open={isAddSentenceDialogOpen}
            isSubmitting={isAddingSentence}
            sentences={sentences}
            onClose={handleCloseAddSentenceDialog}
            onSubmit={handleAddSentence}
          />
        )}

        {canEditLesson && (
          <BulkUploadDialog
            open={isBulkUploadDialogOpen}
            isUploading={isBulkUploading}
            selectedFilename={bulkUploadFilename}
            error={bulkUploadError}
            successMessage={bulkUploadSuccessMessage}
            counts={bulkUploadCounts}
            onClose={handleCloseBulkUploadDialog}
            onFileSelected={handleBulkUploadFileSelected}
            onJsonPasted={handleBulkUploadJsonPasted}
          />
        )}

        {showFlashcards && (
          <Flashcards
            vocabulary={lesson.vocabulary}
            onClose={() => setShowFlashcards(false)}
          />
        )}

        {showSentenceFlashcards && (
          <Flashcards
            vocabulary={sentences}
            title="Sentence Flashcards"
            onClose={() => setShowSentenceFlashcards(false)}
          />
        )}
      </Box>
    </Box>
  );
};
