import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Box, Button, Alert } from "@mui/material";
import type { Lesson, PracticeEntry } from "../types/lesson";
import { Flashcards } from "./Flashcards";
import { VocabularyPractice } from "./VocabularyPractice";
import { LessonHero } from "./lesson/LessonHero";
import { LessonPageSkeleton } from "./lesson/LessonPageSkeleton";
import { LessonPageError } from "./lesson/LessonPageError";
import { TopNav } from "./TopNav";
import { VocabularySection } from "./lesson/VocabularySection";
import { SentenceSection } from "./lesson/SentenceSection";
import { AddVocabularyDialog } from "./lesson/dialogs/AddVocabularyDialog";
import { AddSentenceDialog } from "./lesson/dialogs/AddSentenceDialog";
import { BulkUploadDialog } from "./lesson/dialogs/BulkUploadDialog";
import { MoveToLessonDialog } from "./lesson/dialogs/MoveToLessonDialog";
import { ExamSection } from "./lesson/ExamSection";
import { normalizePinyinWord } from "../utils/pinyin";
import { useAuth } from "@/contexts/AuthContext";
import { loadLessonFromCache, saveLessonToCache } from "../utils/offlineCache";
import {
  applyPracticeOrder,
  omitKey,
  tokenizePinyinWords,
} from "../utils/lessonHelpers";
import { useAudioPlayback } from "../hooks/useAudioPlayback";
import { useGenerateContent } from "../hooks/useGenerateContent";
import { useVocabularyManagement } from "../hooks/useVocabularyManagement";
import { useSentenceManagement } from "../hooks/useSentenceManagement";
import { useBulkUpload } from "../hooks/useBulkUpload";

const LISTEN_PAUSE_MIN_MS = 0;
const LISTEN_PAUSE_MAX_MS = 3000;
const LISTEN_PAUSE_STEP_MS = 100;
const DEFAULT_LISTEN_PAUSE_MS = 800;

export interface LessonPageProps {
  lessonId: string | null;
  onBack: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({ lessonId, onBack }) => {
  const { isAdmin } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSentenceFlashcards, setShowSentenceFlashcards] = useState(false);
  const [showVocabularyPractice, setShowVocabularyPractice] = useState(false);
  const [showSentencePractice, setShowSentencePractice] = useState(false);

  const [vocabularySearchTerm, setVocabularySearchTerm] = useState("");

  const [moveDialogState, setMoveDialogState] = useState<{
    open: boolean;
    itemId: string;
    itemType: "vocabulary" | "sentence";
    itemLabel: string;
  }>({ open: false, itemId: "", itemType: "vocabulary", itemLabel: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const vocabularyList = useMemo(() => lesson?.vocabulary ?? [], [lesson]);
  const sentences = useMemo(() => lesson?.sentences ?? [], [lesson]);
  const sentenceCount = sentences.length;

  // Audio playback hook
  const {
    isVocabularyBatchPlaying,
    currentVocabularyAudioId,
    vocabularyPauseMs,
    setVocabularyPauseMs,
    isSentenceBatchPlaying,
    currentSentenceAudioId,
    sentencePauseMs,
    setSentencePauseMs,
    playWord: handlePlayWord,
    playSentence: handlePlaySentence,
    playPracticeEntry,
    handlePracticeEntryCompleted,
    startVocabularyBatch: handleStartVocabularyBatch,
    toggleVocabularyBatch: handleVocabularyBatchToggle,
    stopVocabularyBatchPlayback,
    startSentenceBatch: handleStartSentenceBatch,
    toggleSentenceBatch: handleSentenceBatchToggle,
    stopSentenceBatchPlayback,
    stopAllPlayback,
    stopCurrentAudio,
  } = useAudioPlayback({
    vocabularyList,
    sentences,
  });

  const missingVocabularyAudioCount = useMemo(() => {
    return vocabularyList.filter((entry) => !entry.audioUrl).length;
  }, [vocabularyList]);
  const missingVocabularyHanziCount = useMemo(() => {
    return vocabularyList.filter((entry) => !entry.hanzi?.trim()).length;
  }, [vocabularyList]);
  const missingSentenceAudioCount = useMemo(() => {
    return sentences.filter((entry) => !entry.audioUrl).length;
  }, [sentences]);
  const missingSentenceHanziCount = useMemo(() => {
    return sentences.filter((entry) => !entry.hanzi?.trim()).length;
  }, [sentences]);
  const resolvedLessonId = lesson?.id ?? lessonId ?? null;

  const canEditLesson = isAdmin;

  const ensureEditable = useCallback(() => {
    if (canEditLesson) {
      return true;
    }
    setActionError("You don't have permission to edit lessons.");
    return false;
  }, [canEditLesson, setActionError]);

  // Content generation hook
  const {
    generatingVocabularyAudioId,
    generatingSentenceAudioId,
    generatingVocabularyHanziId,
    generatingSentenceHanziId,
    verifyingVocabularyId,
    isGeneratingAllVocabularyAudio,
    isGeneratingAllSentenceAudio,
    isGeneratingAllVocabularyHanzi,
    isGeneratingAllSentenceHanzi,
    vocabularyAudioVoices,
    sentenceAudioVoices,
    vocabularyVerificationResults,
    generatedSentenceSuggestions,
    sentenceGenerationErrors,
    generatingSentenceIds,
    savingSentenceIds,
    handleGenerateVocabularyAudio,
    handleGenerateSentenceAudio,
    handleGenerateVocabularyHanzi,
    handleGenerateSentenceHanzi,
    handleVerifyVocabularyPinyin,
    handleGenerateMissingVocabularyAudio,
    handleGenerateMissingSentenceAudio,
    handleGenerateMissingVocabularyHanzi,
    handleGenerateMissingSentenceHanzi,
    handleGenerateSentenceSuggestion,
    handleDismissGeneratedSentence,
    handleSaveGeneratedSentenceSuggestion,
    setVocabularyAudioVoices,
    setSentenceAudioVoices,
    setGeneratedSentenceSuggestions,
    setSentenceGenerationErrors,
    setGeneratingSentenceIds,
    setSavingSentenceIds,
  } = useGenerateContent({
    vocabularyList,
    sentences,
    lessonId: resolvedLessonId,
    ensureEditable,
    setLesson,
    setActionError,
  });

  // Vocabulary management hook
  const {
    isAddDialogOpen,
    setIsAddDialogOpen,
    vocabularyDialogDefaults,
    setVocabularyDialogDefaults,
    isAddingWord,
    deletingWordId,
    updatingVocabularyId,
    isSavingVocabularyOrder,
    handleOpenAddDialog,
    handleCloseAddDialog,
    handleCreateVocabularyFromWord,
    handleAddVocabulary,
    handleDeleteVocabulary,
    handleUpdateVocabulary,
    handleVocabularyDragEnd,
    handleMoveVocabularyToEnd,
    handleChangeVocabularyOrderPosition,
  } = useVocabularyManagement({
    lesson,
    lessonId: resolvedLessonId,
    vocabularyList,
    ensureEditable,
    setLesson,
    setActionError,
    setGeneratedSentenceSuggestions,
    setSentenceGenerationErrors,
    setGeneratingSentenceIds,
    setSavingSentenceIds,
    setVocabularyAudioVoices,
  });

  // Sentence management hook
  const {
    isAddDialogOpen: isAddSentenceDialogOpen,
    isAddingSentence,
    deletingSentenceId,
    updatingSentenceId,
    isSavingSentenceOrder,
    handleOpenAddDialog: handleOpenAddSentenceDialog,
    handleCloseAddDialog: handleCloseAddSentenceDialog,
    handleAddSentence,
    handleDeleteSentence,
    handleUpdateSentence,
    handleSentenceDragEnd,
  } = useSentenceManagement({
    lesson,
    lessonId: resolvedLessonId,
    sentences,
    sentenceCount,
    ensureEditable,
    setLesson,
    setActionError,
    setSentenceAudioVoices,
  });

  // Bulk upload hook
  const {
    isDialogOpen: isBulkUploadDialogOpen,
    isUploading: isBulkUploading,
    error: bulkUploadError,
    successMessage: bulkUploadSuccessMessage,
    counts: bulkUploadCounts,
    filename: bulkUploadFilename,
    handleOpenDialog: handleOpenBulkUploadDialog,
    handleCloseDialog: handleCloseBulkUploadDialog,
    handleFileSelected: handleBulkUploadFileSelected,
    handleJsonPasted: handleBulkUploadJsonPasted,
  } = useBulkUpload({
    lessonId: resolvedLessonId,
    ensureEditable,
    setLesson,
  });

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

    const containsTokenSequence = (
      haystack: string[],
      needle: string[]
    ): boolean => {
      if (!needle.length) {
        return false;
      }
      if (needle.length === 1) {
        return haystack.includes(needle[0]);
      }
      for (let i = 0; i <= haystack.length - needle.length; i += 1) {
        let matches = true;
        for (let j = 0; j < needle.length; j += 1) {
          if (haystack[i + j] !== needle[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return true;
        }
      }
      return false;
    };

    const matches: Record<string, PracticeEntry[]> = {};

    vocabularyList.forEach((vocab) => {
      const vocabTokens = tokenizePinyinWords(vocab.pinyin);
      if (!vocabTokens.length) {
        return;
      }

      const matched: PracticeEntry[] = [];
      sentenceTokens.forEach((tokens, index) => {
        if (containsTokenSequence(tokens, vocabTokens)) {
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
    let isMounted = true;

    const applyLesson = (data: Lesson) => {
      if (!isMounted) {
        return;
      }
      setLesson(data);
      setError(null);
    };

    const cachedLesson = loadLessonFromCache(lessonId);
    if (cachedLesson) {
      applyLesson(cachedLesson);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const fetchLesson = async () => {
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
        saveLessonToCache(data);
        applyLesson(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        const fallbackLesson = loadLessonFromCache(lessonId);
        if (fallbackLesson) {
          applyLesson(fallbackLesson);
        } else {
          setError((err as Error).message || "Failed to load lesson");
          setLesson(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      if (!cachedLesson) {
        setLesson(null);
        setError(
          "You're offline and this lesson hasn't been saved for offline use yet."
        );
      }
      setIsLoading(false);
    } else {
      fetchLesson();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [lessonId]);

  const handleOpenMoveVocabularyDialog = useCallback(
    (vocabId: string) => {
      const vocab = lesson?.vocabulary.find((v) => v.id === vocabId);
      if (!vocab) return;
      setMoveDialogState({
        open: true,
        itemId: vocabId,
        itemType: "vocabulary",
        itemLabel: `${vocab.pinyin} (${vocab.english})`,
      });
    },
    [lesson?.vocabulary]
  );

  const handleOpenMoveSentenceDialog = useCallback(
    (sentenceId: string) => {
      const sentence = sentences.find((s) => s.id === sentenceId);
      if (!sentence) return;
      setMoveDialogState({
        open: true,
        itemId: sentenceId,
        itemType: "sentence",
        itemLabel: sentence.english,
      });
    },
    [sentences]
  );

  const handleCloseMoveDialog = useCallback(() => {
    setMoveDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleMoveToLesson = useCallback(
    async (targetLessonId: string) => {
      if (!ensureEditable()) {
        return;
      }
      const { itemId, itemType } = moveDialogState;
      const endpoint =
        itemType === "vocabulary"
          ? `/api/vocabulary/${itemId}`
          : `/api/sentences/${itemId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: targetLessonId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to move ${itemType}`);
      }

      // Remove the item from the current lesson state
      if (itemType === "vocabulary") {
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vocabulary: prev.vocabulary.filter((v) => v.id !== itemId),
          };
        });
        setGeneratedSentenceSuggestions((prev) => omitKey(prev, itemId));
        setSentenceGenerationErrors((prev) => omitKey(prev, itemId));
        setGeneratingSentenceIds((prev) => omitKey(prev, itemId));
        setSavingSentenceIds((prev) => omitKey(prev, itemId));
        setVocabularyAudioVoices((prev) => omitKey(prev, itemId));
      } else {
        setLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sentences: prev.sentences.filter((s) => s.id !== itemId),
          };
        });
        setSentenceAudioVoices((prev) => omitKey(prev, itemId));
      }
    },
    [ensureEditable, moveDialogState]
  );

  const handleBackClick = useCallback(() => {
    stopAllPlayback();
    onBack();
  }, [onBack, stopAllPlayback]);

  if (isLoading) {
    return (
      <>
        <TopNav />
        <LessonPageSkeleton />
      </>
    );
  }

  if (error || !lesson) {
    return (
      <>
        <TopNav />
        <LessonPageError error={error} onBackClick={handleBackClick} />
      </>
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
    <>
      <TopNav
        breadcrumb={{
          program: lesson.program?.name,
          level: lesson.level
            ? {
                id: lesson.level.id,
                order: lesson.level.order,
                name: lesson.level.name,
              }
            : undefined,
          unit: lesson.unit
            ? {
                id: lesson.unit.id,
                order: lesson.unit.order,
                name: lesson.unit.name,
              }
            : undefined,
          lesson: lesson.name,
        }}
      />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          py: { xs: 2, sm: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: (theme) =>
            theme.palette.mode === "dark"
              ? "url('/hanziBackgroundDark.svg')"
              : "url('/haziBackground.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
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
            listenPauseMs={vocabularyPauseMs}
            listenPauseMinMs={LISTEN_PAUSE_MIN_MS}
            listenPauseMaxMs={LISTEN_PAUSE_MAX_MS}
            listenPauseStepMs={LISTEN_PAUSE_STEP_MS}
            onListenPauseChange={setVocabularyPauseMs}
            onStopPlayback={stopVocabularyBatchPlayback}
            showOrderNumbers={canEditLesson}
            onMoveWordToLesson={
              canEditLesson ? handleOpenMoveVocabularyDialog : undefined
            }
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
            missingHanziCount={missingSentenceHanziCount}
            isGeneratingMissingHanzi={isGeneratingAllSentenceHanzi}
            onGenerateMissingHanzi={
              canEditLesson ? handleGenerateMissingSentenceHanzi : undefined
            }
            onPlaySentence={handlePlaySentence}
            onDeleteSentence={canEditLesson ? handleDeleteSentence : undefined}
            onRegenerateAudio={
              canEditLesson ? handleGenerateSentenceAudio : undefined
            }
            onGenerateHanzi={
              canEditLesson ? handleGenerateSentenceHanzi : undefined
            }
            generatingHanziId={generatingSentenceHanziId}
            audioVoices={sentenceAudioVoices}
            onEditSentence={canEditLesson ? handleUpdateSentence : undefined}
            updatingSentenceId={updatingSentenceId}
            reorderingEnabled={canEditLesson}
            listenPauseMs={sentencePauseMs}
            listenPauseMinMs={LISTEN_PAUSE_MIN_MS}
            listenPauseMaxMs={LISTEN_PAUSE_MAX_MS}
            listenPauseStepMs={LISTEN_PAUSE_STEP_MS}
            onListenPauseChange={setSentencePauseMs}
            onStopPlayback={stopSentenceBatchPlayback}
            showSentenceIndices={canEditLesson}
            onMoveSentenceToLesson={
              canEditLesson ? handleOpenMoveSentenceDialog : undefined
            }
          />

          {/* Exam Section */}
          {resolvedLessonId && <ExamSection lessonId={resolvedLessonId} />}

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

          {canEditLesson && resolvedLessonId && (
            <MoveToLessonDialog
              open={moveDialogState.open}
              currentLessonId={resolvedLessonId}
              itemType={moveDialogState.itemType}
              itemLabel={moveDialogState.itemLabel}
              onClose={handleCloseMoveDialog}
              onMove={handleMoveToLesson}
            />
          )}
        </Box>
      </Box>
    </>
  );
};
