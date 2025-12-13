import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeEntry } from "../types/lesson";

export interface UseAudioPlaybackOptions {
  vocabularyList: PracticeEntry[];
  sentences: PracticeEntry[];
  defaultPauseMs?: number;
}

export interface UseAudioPlaybackReturn {
  // Vocabulary batch state
  isVocabularyBatchPlaying: boolean;
  currentVocabularyAudioId: string | null;
  vocabularyPauseMs: number;
  setVocabularyPauseMs: (ms: number) => void;

  // Sentence batch state
  isSentenceBatchPlaying: boolean;
  currentSentenceAudioId: string | null;
  sentencePauseMs: number;
  setSentencePauseMs: (ms: number) => void;

  // Actions
  playWord: (vocabId: string) => void;
  playSentence: (sentenceId: string) => void;
  playPracticeEntry: (
    entry: PracticeEntry,
    options?: { onFinished?: () => void; delayMs?: number }
  ) => void;
  handlePracticeEntryCompleted: (
    entry: PracticeEntry,
    proceed: () => void
  ) => void;

  // Vocabulary batch controls
  startVocabularyBatch: (startIndex?: number) => void;
  toggleVocabularyBatch: () => void;
  stopVocabularyBatchPlayback: (options?: { resetIndex?: boolean }) => void;

  // Sentence batch controls
  startSentenceBatch: (startIndex?: number) => void;
  toggleSentenceBatch: () => void;
  stopSentenceBatchPlayback: (options?: { resetIndex?: boolean }) => void;

  // General controls
  stopAllPlayback: () => void;
  stopCurrentAudio: () => void;
}

const DEFAULT_LISTEN_PAUSE_MS = 800;

export function useAudioPlayback({
  vocabularyList,
  sentences,
  defaultPauseMs = DEFAULT_LISTEN_PAUSE_MS,
}: UseAudioPlaybackOptions): UseAudioPlaybackReturn {
  // Batch playback state
  const [isVocabularyBatchPlaying, setIsVocabularyBatchPlaying] =
    useState(false);
  const [isSentenceBatchPlaying, setIsSentenceBatchPlaying] = useState(false);
  const [currentVocabularyAudioId, setCurrentVocabularyAudioId] = useState<
    string | null
  >(null);
  const [currentSentenceAudioId, setCurrentSentenceAudioId] = useState<
    string | null
  >(null);

  // Pause settings
  const [vocabularyPauseMs, setVocabularyPauseMs] = useState(defaultPauseMs);
  const [sentencePauseMs, setSentencePauseMs] = useState(defaultPauseMs);

  // Refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const vocabularyBatchTokenRef = useRef(0);
  const sentenceBatchTokenRef = useRef(0);
  const vocabularyPauseMsRef = useRef(vocabularyPauseMs);
  const sentencePauseMsRef = useRef(sentencePauseMs);
  const vocabularyBatchResumeIndexRef = useRef(0);
  const sentenceBatchResumeIndexRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    vocabularyPauseMsRef.current = vocabularyPauseMs;
  }, [vocabularyPauseMs]);

  useEffect(() => {
    sentencePauseMsRef.current = sentencePauseMs;
  }, [sentencePauseMs]);

  // Clear pause timeout
  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current !== null) {
      if (typeof window !== "undefined") {
        window.clearTimeout(pauseTimeoutRef.current);
      }
      pauseTimeoutRef.current = null;
    }
  }, []);

  // Stop current audio/speech
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
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  // Stop vocabulary batch
  const stopVocabularyBatchPlayback = useCallback(
    (options?: { resetIndex?: boolean }) => {
      vocabularyBatchTokenRef.current += 1;
      setIsVocabularyBatchPlaying(false);
      setCurrentVocabularyAudioId(null);
      if (options?.resetIndex !== false) {
        vocabularyBatchResumeIndexRef.current = 0;
      }
    },
    []
  );

  // Stop sentence batch
  const stopSentenceBatchPlayback = useCallback(
    (options?: { resetIndex?: boolean }) => {
      sentenceBatchTokenRef.current += 1;
      setIsSentenceBatchPlaying(false);
      setCurrentSentenceAudioId(null);
      if (options?.resetIndex !== false) {
        sentenceBatchResumeIndexRef.current = 0;
      }
    },
    []
  );

  // Stop all playback
  const stopAllPlayback = useCallback(() => {
    stopCurrentAudio();
    stopVocabularyBatchPlayback();
    stopSentenceBatchPlayback();
  }, [stopCurrentAudio, stopVocabularyBatchPlayback, stopSentenceBatchPlayback]);

  // Pause vocabulary batch (keeps resume index)
  const pauseVocabularyBatchPlayback = useCallback(() => {
    stopCurrentAudio();
    stopVocabularyBatchPlayback({ resetIndex: false });
  }, [stopCurrentAudio, stopVocabularyBatchPlayback]);

  // Pause sentence batch (keeps resume index)
  const pauseSentenceBatchPlayback = useCallback(() => {
    stopCurrentAudio();
    stopSentenceBatchPlayback({ resetIndex: false });
  }, [stopCurrentAudio, stopSentenceBatchPlayback]);

  // Play a single practice entry
  const playPracticeEntry = useCallback(
    (
      entry: PracticeEntry,
      options?: { onFinished?: () => void; delayMs?: number }
    ) => {
      const onFinished = options?.onFinished;
      const delayMs = options?.delayMs ?? 0;

      const invokeFinished = () => {
        if (!onFinished) {
          return;
        }
        if (delayMs > 0 && typeof window !== "undefined") {
          pauseTimeoutRef.current = window.setTimeout(() => {
            pauseTimeoutRef.current = null;
            onFinished();
          }, delayMs);
        } else {
          onFinished();
        }
      };

      const handleDone = () => {
        stopCurrentAudio();
        invokeFinished();
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

  // Play word at index (for batch playback)
  const playWordAtIndex = useCallback(
    (index: number, token: number) => {
      if (token !== vocabularyBatchTokenRef.current) {
        return;
      }

      if (!vocabularyList.length) {
        stopVocabularyBatchPlayback();
        return;
      }

      if (index < 0 || index >= vocabularyList.length) {
        stopVocabularyBatchPlayback();
        return;
      }

      vocabularyBatchResumeIndexRef.current = index;

      const entry = vocabularyList[index];
      setCurrentVocabularyAudioId(entry.id);
      playPracticeEntry(entry, {
        onFinished: () => {
          vocabularyBatchResumeIndexRef.current = index + 1;
          playWordAtIndex(index + 1, token);
        },
        delayMs: vocabularyPauseMsRef.current,
      });
    },
    [vocabularyList, playPracticeEntry, stopVocabularyBatchPlayback]
  );

  // Play sentence at index (for batch playback)
  const playSentenceAtIndex = useCallback(
    (index: number, token: number) => {
      if (token !== sentenceBatchTokenRef.current) {
        return;
      }

      if (!sentences.length) {
        stopSentenceBatchPlayback();
        return;
      }

      if (index < 0 || index >= sentences.length) {
        stopSentenceBatchPlayback();
        return;
      }

      sentenceBatchResumeIndexRef.current = index;

      const entry = sentences[index];
      setCurrentSentenceAudioId(entry.id);
      playPracticeEntry(entry, {
        onFinished: () => {
          sentenceBatchResumeIndexRef.current = index + 1;
          playSentenceAtIndex(index + 1, token);
        },
        delayMs: sentencePauseMsRef.current,
      });
    },
    [sentences, playPracticeEntry, stopSentenceBatchPlayback]
  );

  // Play a single word
  const playWord = useCallback(
    (vocabId: string) => {
      if (!vocabularyList.length) {
        return;
      }
      const entry = vocabularyList.find((v) => v.id === vocabId);
      if (!entry) {
        return;
      }
      stopAllPlayback();
      setCurrentVocabularyAudioId(entry.id);
      playPracticeEntry(entry, {
        onFinished: () => setCurrentVocabularyAudioId(null),
      });
    },
    [vocabularyList, playPracticeEntry, stopAllPlayback]
  );

  // Play a single sentence
  const playSentence = useCallback(
    (sentenceId: string) => {
      const sentence = sentences.find((s) => s.id === sentenceId);
      if (!sentence) {
        return;
      }
      stopAllPlayback();
      setCurrentSentenceAudioId(sentenceId);
      playPracticeEntry(sentence, {
        onFinished: () => setCurrentSentenceAudioId(null),
      });
    },
    [sentences, playPracticeEntry, stopAllPlayback]
  );

  // Handle practice entry completed (used in practice mode)
  const handlePracticeEntryCompleted = useCallback(
    (entry: PracticeEntry, proceed: () => void) => {
      stopCurrentAudio();
      playPracticeEntry(entry, { onFinished: proceed });
    },
    [playPracticeEntry, stopCurrentAudio]
  );

  // Start vocabulary batch playback
  const startVocabularyBatch = useCallback(
    (startIndex?: number) => {
      if (!vocabularyList.length) {
        return;
      }

      const normalizedIndex =
        typeof startIndex === "number" &&
        startIndex >= 0 &&
        startIndex < vocabularyList.length
          ? startIndex
          : 0;

      stopCurrentAudio();
      stopSentenceBatchPlayback();

      vocabularyBatchResumeIndexRef.current = normalizedIndex;
      const token = vocabularyBatchTokenRef.current;
      setIsVocabularyBatchPlaying(true);
      playWordAtIndex(normalizedIndex, token);
    },
    [
      vocabularyList.length,
      playWordAtIndex,
      stopCurrentAudio,
      stopSentenceBatchPlayback,
    ]
  );

  // Toggle vocabulary batch playback
  const toggleVocabularyBatch = useCallback(() => {
    if (isVocabularyBatchPlaying) {
      pauseVocabularyBatchPlayback();
      return;
    }
    startVocabularyBatch(vocabularyBatchResumeIndexRef.current);
  }, [
    isVocabularyBatchPlaying,
    pauseVocabularyBatchPlayback,
    startVocabularyBatch,
  ]);

  // Start sentence batch playback
  const startSentenceBatch = useCallback(
    (startIndex?: number) => {
      if (!sentences.length) {
        return;
      }

      const normalizedIndex =
        typeof startIndex === "number" &&
        startIndex >= 0 &&
        startIndex < sentences.length
          ? startIndex
          : 0;

      stopCurrentAudio();
      stopVocabularyBatchPlayback();

      sentenceBatchResumeIndexRef.current = normalizedIndex;
      const token = sentenceBatchTokenRef.current;
      setIsSentenceBatchPlaying(true);
      playSentenceAtIndex(normalizedIndex, token);
    },
    [
      sentences.length,
      playSentenceAtIndex,
      stopCurrentAudio,
      stopVocabularyBatchPlayback,
    ]
  );

  // Toggle sentence batch playback
  const toggleSentenceBatch = useCallback(() => {
    if (isSentenceBatchPlaying) {
      pauseSentenceBatchPlayback();
      return;
    }
    startSentenceBatch(sentenceBatchResumeIndexRef.current);
  }, [
    isSentenceBatchPlaying,
    pauseSentenceBatchPlayback,
    startSentenceBatch,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  return {
    // Vocabulary batch state
    isVocabularyBatchPlaying,
    currentVocabularyAudioId,
    vocabularyPauseMs,
    setVocabularyPauseMs,

    // Sentence batch state
    isSentenceBatchPlaying,
    currentSentenceAudioId,
    sentencePauseMs,
    setSentencePauseMs,

    // Actions
    playWord,
    playSentence,
    playPracticeEntry,
    handlePracticeEntryCompleted,

    // Vocabulary batch controls
    startVocabularyBatch,
    toggleVocabularyBatch,
    stopVocabularyBatchPlayback,

    // Sentence batch controls
    startSentenceBatch,
    toggleSentenceBatch,
    stopSentenceBatchPlayback,

    // General controls
    stopAllPlayback,
    stopCurrentAudio,
  };
}
