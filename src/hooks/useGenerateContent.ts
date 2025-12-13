import { useCallback, useState } from "react";
import type { Lesson, PracticeEntry } from "../types/lesson";

const omitKey = <T,>(record: Record<string, T>, key: string) => {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return record;
  }
  const next = { ...record };
  delete next[key];
  return next;
};

export interface UseGenerateContentOptions {
  vocabularyList: PracticeEntry[];
  sentences: PracticeEntry[];
  lessonId: string | null;
  ensureEditable: () => boolean;
  setLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  setActionError: (error: string | null) => void;
}

export interface UseGenerateContentReturn {
  // Single item generation loading states
  generatingVocabularyAudioId: string | null;
  generatingSentenceAudioId: string | null;
  generatingVocabularyHanziId: string | null;
  generatingSentenceHanziId: string | null;
  verifyingVocabularyId: string | null;

  // Batch generation loading states
  isGeneratingAllVocabularyAudio: boolean;
  isGeneratingAllSentenceAudio: boolean;
  isGeneratingAllVocabularyHanzi: boolean;
  isGeneratingAllSentenceHanzi: boolean;

  // Audio voice tracking
  vocabularyAudioVoices: Record<string, string>;
  sentenceAudioVoices: Record<string, string>;

  // Verification results
  vocabularyVerificationResults: Record<
    string,
    { status: "success" | "error"; message: string | null }
  >;

  // Sentence suggestion state
  generatedSentenceSuggestions: Record<
    string,
    { pinyin: string; english: string }
  >;
  sentenceGenerationErrors: Record<string, string>;
  generatingSentenceIds: Record<string, boolean>;
  savingSentenceIds: Record<string, boolean>;

  // Single item generation actions
  handleGenerateVocabularyAudio: (vocabId: string) => Promise<void>;
  handleGenerateSentenceAudio: (sentenceId: string) => Promise<void>;
  handleGenerateVocabularyHanzi: (vocabId: string) => Promise<void>;
  handleGenerateSentenceHanzi: (sentenceId: string) => Promise<void>;
  handleVerifyVocabularyPinyin: (vocabId: string) => Promise<void>;

  // Batch generation actions
  handleGenerateMissingVocabularyAudio: () => Promise<void>;
  handleGenerateMissingSentenceAudio: () => Promise<void>;
  handleGenerateMissingVocabularyHanzi: () => Promise<void>;
  handleGenerateMissingSentenceHanzi: () => Promise<void>;

  // Sentence suggestion actions
  handleGenerateSentenceSuggestion: (vocabId: string) => Promise<void>;
  handleDismissGeneratedSentence: (vocabId: string) => void;
  handleSaveGeneratedSentenceSuggestion: (vocabId: string) => Promise<void>;

  // Setters for state cleanup on item deletion
  setVocabularyAudioVoices: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setSentenceAudioVoices: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
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
}

export function useGenerateContent({
  vocabularyList,
  sentences,
  lessonId,
  ensureEditable,
  setLesson,
  setActionError,
}: UseGenerateContentOptions): UseGenerateContentReturn {
  // Single item generation loading states
  const [generatingVocabularyAudioId, setGeneratingVocabularyAudioId] =
    useState<string | null>(null);
  const [generatingSentenceAudioId, setGeneratingSentenceAudioId] = useState<
    string | null
  >(null);
  const [generatingVocabularyHanziId, setGeneratingVocabularyHanziId] =
    useState<string | null>(null);
  const [generatingSentenceHanziId, setGeneratingSentenceHanziId] = useState<
    string | null
  >(null);
  const [verifyingVocabularyId, setVerifyingVocabularyId] = useState<
    string | null
  >(null);

  // Batch generation loading states
  const [isGeneratingAllVocabularyAudio, setIsGeneratingAllVocabularyAudio] =
    useState(false);
  const [isGeneratingAllSentenceAudio, setIsGeneratingAllSentenceAudio] =
    useState(false);
  const [isGeneratingAllVocabularyHanzi, setIsGeneratingAllVocabularyHanzi] =
    useState(false);
  const [isGeneratingAllSentenceHanzi, setIsGeneratingAllSentenceHanzi] =
    useState(false);

  // Audio voice tracking
  const [vocabularyAudioVoices, setVocabularyAudioVoices] = useState<
    Record<string, string>
  >({});
  const [sentenceAudioVoices, setSentenceAudioVoices] = useState<
    Record<string, string>
  >({});

  // Verification results
  const [vocabularyVerificationResults, setVocabularyVerificationResults] =
    useState<
      Record<string, { status: "success" | "error"; message: string | null }>
    >({});

  // Sentence suggestion state
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

  // Generate vocabulary audio
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
    [ensureEditable, setActionError, setLesson]
  );

  // Generate sentence audio
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
        const normalizedVoice =
          typeof data.voice === "string" ? data.voice.trim() : "";
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
        setSentenceAudioVoices((prev) =>
          normalizedVoice
            ? { ...prev, [sentenceId]: normalizedVoice }
            : omitKey(prev, sentenceId)
        );
      } catch (err) {
        console.error("Failed to generate sentence audio", err);
        setActionError((err as Error).message || "Failed to generate audio");
      } finally {
        setGeneratingSentenceAudioId(null);
      }
    },
    [ensureEditable, setActionError, setLesson]
  );

  // Generate vocabulary hanzi
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
    [ensureEditable, setActionError, setLesson]
  );

  // Generate sentence hanzi
  const handleGenerateSentenceHanzi = useCallback(
    async (sentenceId: string) => {
      if (!ensureEditable()) {
        return;
      }

      setActionError(null);
      setGeneratingSentenceHanziId(sentenceId);

      try {
        const response = await fetch(`/api/sentences/${sentenceId}/hanzi`, {
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
            sentences: prev.sentences.map((entry) =>
              entry.id === sentenceId ? { ...entry, hanzi } : entry
            ),
          };
        });
      } catch (err) {
        console.error("Failed to generate sentence hanzi", err);
        setActionError(
          (err as Error).message || "Failed to generate sentence hanzi"
        );
      } finally {
        setGeneratingSentenceHanziId(null);
      }
    },
    [ensureEditable, setActionError, setLesson]
  );

  // Verify vocabulary pinyin
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
    [ensureEditable, setActionError, setLesson]
  );

  // Generate missing vocabulary hanzi (batch)
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
  }, [
    ensureEditable,
    handleGenerateVocabularyHanzi,
    vocabularyList,
    setActionError,
  ]);

  // Generate missing vocabulary audio (batch)
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
  }, [
    ensureEditable,
    handleGenerateVocabularyAudio,
    vocabularyList,
    setActionError,
  ]);

  // Generate missing sentence audio (batch)
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
  }, [ensureEditable, handleGenerateSentenceAudio, sentences, setActionError]);

  // Generate missing sentence hanzi (batch)
  const handleGenerateMissingSentenceHanzi = useCallback(async () => {
    const missingEntries = sentences.filter((entry) => !entry.hanzi?.trim());
    if (!missingEntries.length) {
      return;
    }

    if (!ensureEditable()) {
      return;
    }

    setActionError(null);
    setIsGeneratingAllSentenceHanzi(true);

    try {
      for (const entry of missingEntries) {
        await handleGenerateSentenceHanzi(entry.id);
      }
    } finally {
      setIsGeneratingAllSentenceHanzi(false);
    }
  }, [ensureEditable, handleGenerateSentenceHanzi, sentences, setActionError]);

  // Generate sentence suggestion for a vocabulary word
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

  // Dismiss generated sentence suggestion
  const handleDismissGeneratedSentence = useCallback((vocabId: string) => {
    setGeneratedSentenceSuggestions((prev) => omitKey(prev, vocabId));
    setSentenceGenerationErrors((prev) => omitKey(prev, vocabId));
  }, []);

  // Save generated sentence suggestion
  const handleSaveGeneratedSentenceSuggestion = useCallback(
    async (vocabId: string) => {
      if (!ensureEditable()) {
        return;
      }
      if (!lessonId) {
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
            lessonId: lessonId,
            pinyin: suggestion.pinyin,
            english: suggestion.english,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to save sentence");
        }

        const newSentence: PracticeEntry = {
          id: data.id,
          pinyin: suggestion.pinyin,
          english: suggestion.english,
          audioUrl: data.audioUrl ?? null,
          hanzi: data.hanzi ?? null,
        };

        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: [...prev.sentences, newSentence],
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
    [ensureEditable, generatedSentenceSuggestions, lessonId, setActionError, setLesson]
  );

  return {
    // Single item generation loading states
    generatingVocabularyAudioId,
    generatingSentenceAudioId,
    generatingVocabularyHanziId,
    generatingSentenceHanziId,
    verifyingVocabularyId,

    // Batch generation loading states
    isGeneratingAllVocabularyAudio,
    isGeneratingAllSentenceAudio,
    isGeneratingAllVocabularyHanzi,
    isGeneratingAllSentenceHanzi,

    // Audio voice tracking
    vocabularyAudioVoices,
    sentenceAudioVoices,

    // Verification results
    vocabularyVerificationResults,

    // Sentence suggestion state
    generatedSentenceSuggestions,
    sentenceGenerationErrors,
    generatingSentenceIds,
    savingSentenceIds,

    // Single item generation actions
    handleGenerateVocabularyAudio,
    handleGenerateSentenceAudio,
    handleGenerateVocabularyHanzi,
    handleGenerateSentenceHanzi,
    handleVerifyVocabularyPinyin,

    // Batch generation actions
    handleGenerateMissingVocabularyAudio,
    handleGenerateMissingSentenceAudio,
    handleGenerateMissingVocabularyHanzi,
    handleGenerateMissingSentenceHanzi,

    // Sentence suggestion actions
    handleGenerateSentenceSuggestion,
    handleDismissGeneratedSentence,
    handleSaveGeneratedSentenceSuggestion,

    // Setters for state cleanup on item deletion
    setVocabularyAudioVoices,
    setSentenceAudioVoices,
    setGeneratedSentenceSuggestions,
    setSentenceGenerationErrors,
    setGeneratingSentenceIds,
    setSavingSentenceIds,
  };
}
