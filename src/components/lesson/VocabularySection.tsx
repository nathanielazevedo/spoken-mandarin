import React, { useMemo, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Alert,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Psychology as PracticeIcon,
  VolumeUp as VolumeIcon,
  AddCircleOutline as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  GraphicEq as AudioWaveIcon,
  Translate as TranslateIcon,
  Mic as MicIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";
import { PracticeSection } from "./PracticeSection";
import { SortablePracticeCard } from "./SortablePracticeCard";
import { EditEntryDialog } from "./dialogs/EditEntryDialog";
import { ConfirmDeleteDialog } from "./dialogs/ConfirmDeleteDialog";
import { ListenDialog } from "./dialogs/ListenDialog";
import { PracticeSpeakingDialog } from "./dialogs/PracticeSpeakingDialog";
import { useEntryDialogs } from "../../hooks/useEntryDialogs";
const STRIP_DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const toSearchKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(STRIP_DIACRITICS_REGEX, "");

type DndSensors = NonNullable<Parameters<typeof DndContext>[0]["sensors"]>;

export interface VocabularySectionProps {
  vocabulary: PracticeEntry[];
  sentenceMatches?: Record<string, PracticeEntry[]>;
  duplicateVocabularyMap?: Record<
    string,
    { normalizedKey: string; others: PracticeEntry[] }
  >;
  duplicateVocabularyGroups?: Array<{
    normalizedKey: string;
    entries: PracticeEntry[];
  }>;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  generatedSentenceSuggestions?: Record<
    string,
    { pinyin: string; english: string }
  >;
  generatingSentenceIds?: Record<string, boolean>;
  savingSentenceIds?: Record<string, boolean>;
  sentenceGenerationErrors?: Record<string, string>;
  onGenerateSentence?: (id: string) => void;
  onSaveGeneratedSentence?: (id: string) => void;
  onDismissGeneratedSentence?: (id: string) => void;
  sensors: DndSensors;
  onDragEnd?: (event: DragEndEvent) => void;
  isSavingOrder: boolean;
  isBatchPlaying: boolean;
  onBatchToggle: () => void;
  onPracticeClick: () => void;
  onAddWordClick?: () => void;
  onFlashcardsClick: () => void;
  currentAudioId: string | null;
  deletingWordId: string | null;
  generatingAudioId: string | null;
  missingAudioCount?: number;
  isGeneratingMissingAudio?: boolean;
  onGenerateMissingAudio?: () => void;
  missingHanziCount?: number;
  isGeneratingMissingHanzi?: boolean;
  onGenerateMissingHanzi?: () => void;
  audioVoices?: Record<string, string>;
  onPlayWord: (id: string) => void;
  onDeleteWord?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
  onMoveWordToEnd?: (id: string) => void;
  onChangeWordOrder?: (id: string, nextPosition: number) => void;
  reorderingEnabled?: boolean;
  onEditWord?: (
    id: string,
    payload: { pinyin: string; english: string }
  ) => Promise<void> | void;
  updatingWordId?: string | null;
  onVerifyWord?: (id: string) => Promise<void> | void;
  verifyingWordId?: string | null;
  verificationResults?: Record<
    string,
    { status: "success" | "error"; message: string | null }
  >;
  onGenerateHanzi?: (id: string) => Promise<void> | void;
  generatingHanziId?: string | null;
  listenPauseMs?: number;
  listenPauseMinMs?: number;
  listenPauseMaxMs?: number;
  listenPauseStepMs?: number;
  onListenPauseChange?: (value: number) => void;
  onStopPlayback?: () => void;
  showOrderNumbers?: boolean;
  onMoveWordToLesson?: (id: string) => void;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({
  vocabulary,
  sentenceMatches,
  duplicateVocabularyMap,
  duplicateVocabularyGroups,
  searchTerm,
  onSearchTermChange,
  generatedSentenceSuggestions,
  generatingSentenceIds,
  savingSentenceIds,
  sentenceGenerationErrors,
  onGenerateSentence,
  onSaveGeneratedSentence,
  onDismissGeneratedSentence,
  sensors,
  onDragEnd,
  isSavingOrder,
  isBatchPlaying,
  onBatchToggle,
  onPracticeClick,
  onAddWordClick,
  currentAudioId,
  deletingWordId,
  generatingAudioId,
  missingAudioCount,
  isGeneratingMissingAudio,
  onGenerateMissingAudio,
  missingHanziCount,
  isGeneratingMissingHanzi,
  onGenerateMissingHanzi,
  audioVoices,
  onPlayWord,
  onDeleteWord,
  onRegenerateAudio,
  onMoveWordToEnd,
  onChangeWordOrder,
  reorderingEnabled = true,
  onEditWord,
  updatingWordId,
  onVerifyWord,
  verifyingWordId,
  verificationResults,
  onGenerateHanzi,
  generatingHanziId,
  listenPauseMs,
  listenPauseMinMs,
  listenPauseMaxMs,
  listenPauseStepMs,
  onListenPauseChange,
  onStopPlayback,
  showOrderNumbers = true,
  onMoveWordToLesson,
}) => {
  const [isListenDialogOpen, setIsListenDialogOpen] = useState(false);
  const [isSpeakDialogOpen, setIsSpeakDialogOpen] = useState(false);

  const handleOpenListenDialog = () => {
    setIsListenDialogOpen(true);
  };

  const handleCloseListenDialog = () => {
    setIsListenDialogOpen(false);
  };

  const handleOpenSpeakDialog = () => {
    setIsSpeakDialogOpen(true);
  };

  const handleCloseSpeakDialog = () => {
    setIsSpeakDialogOpen(false);
  };

  const handleStopPlayback = () => {
    onStopPlayback?.();
  };

  const generateAudioLabel = isGeneratingMissingAudio
    ? "Generating audio..."
    : missingAudioCount && missingAudioCount > 0
    ? `Generate audio (${missingAudioCount})`
    : "Generate missing audio";
  const generateHanziLabel = isGeneratingMissingHanzi
    ? "Generating hanzi..."
    : missingHanziCount && missingHanziCount > 0
    ? `Generate hanzi (${missingHanziCount})`
    : "Generate missing hanzi";

  const showGenerateAudioAction = Boolean(onGenerateMissingAudio);
  const showGenerateHanziAction = Boolean(onGenerateMissingHanzi);
  const hasBulkActions = showGenerateAudioAction || showGenerateHanziAction;

  return (
    <>
      <PracticeSection
        title="Vocabulary"
        subtitle={`${vocabulary.length} words`}
        listenButton={{
          label: "Listen to deck",
          icon: <VolumeIcon />,
          onClick: handleOpenListenDialog,
          disabled: !vocabulary.length,
        }}
        practiceButton={{
          label: "Practice",
          icon: <PracticeIcon />,
          onClick: onPracticeClick,
          disabled: !vocabulary.length,
        }}
        speakButton={{
          label: "Practice Speaking",
          icon: <MicIcon />,
          onClick: handleOpenSpeakDialog,
          disabled: !vocabulary.length,
        }}
        addButton={
          onAddWordClick
            ? {
                label: "Add word",
                icon: <AddIcon />,
                onClick: onAddWordClick,
                disabled: false,
              }
            : undefined
        }
        infoMessage={
          reorderingEnabled && isSavingOrder ? "Saving new order..." : null
        }
        extraActions={
          hasBulkActions ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {showGenerateAudioAction && (
                <Tooltip title={generateAudioLabel} key="generate-audio">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={onGenerateMissingAudio}
                      disabled={
                        isGeneratingMissingAudio ||
                        !missingAudioCount ||
                        !vocabulary.length
                      }
                      aria-label="Generate missing audio"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        width: 48,
                        height: 48,
                      }}
                    >
                      {missingAudioCount && missingAudioCount > 0 ? (
                        <Badge
                          color="secondary"
                          badgeContent={missingAudioCount}
                        >
                          <AudioWaveIcon />
                        </Badge>
                      ) : (
                        <AudioWaveIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {showGenerateHanziAction && (
                <Tooltip title={generateHanziLabel} key="generate-hanzi">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={onGenerateMissingHanzi}
                      disabled={
                        isGeneratingMissingHanzi ||
                        !missingHanziCount ||
                        !vocabulary.length
                      }
                      aria-label="Generate missing hanzi"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        width: 48,
                        height: 48,
                      }}
                    >
                      {missingHanziCount && missingHanziCount > 0 ? (
                        <Badge
                          color="secondary"
                          badgeContent={missingHanziCount}
                        >
                          <TranslateIcon />
                        </Badge>
                      ) : (
                        <TranslateIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          ) : undefined
        }
      >
        {vocabulary.length === 0 ? (
          <Typography color="text.secondary">No vocabulary yet.</Typography>
        ) : (
          <>
            <TextField
              size="small"
              placeholder="Search pinyin or English"
              value={searchTerm ?? ""}
              onChange={(event) => onSearchTermChange?.(event.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment:
                  searchTerm && searchTerm.length > 0 ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => onSearchTermChange?.("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
              }}
            />
            {duplicateVocabularyGroups?.length ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Duplicate pinyin detected for{" "}
                {duplicateVocabularyGroups
                  .map((group) => group.entries[0]?.pinyin || "(unknown)")
                  .join(", ")}
                .
              </Alert>
            ) : null}
            <VocabularyListContent
              vocabulary={vocabulary}
              searchTerm={searchTerm}
              sentenceMatches={sentenceMatches}
              duplicateVocabularyMap={duplicateVocabularyMap}
              sensors={sensors}
              onDragEnd={reorderingEnabled ? onDragEnd : undefined}
              isSavingOrder={isSavingOrder}
              currentAudioId={currentAudioId}
              deletingWordId={deletingWordId}
              generatingAudioId={generatingAudioId}
              audioVoices={audioVoices}
              onPlayWord={onPlayWord}
              onDeleteWord={onDeleteWord}
              onRegenerateAudio={onRegenerateAudio}
              onMoveWordToEnd={onMoveWordToEnd}
              onChangeWordOrder={onChangeWordOrder}
              reorderingEnabled={reorderingEnabled}
              generatedSentenceSuggestions={generatedSentenceSuggestions}
              generatingSentenceIds={generatingSentenceIds}
              savingSentenceIds={savingSentenceIds}
              sentenceGenerationErrors={sentenceGenerationErrors}
              onGenerateSentence={onGenerateSentence}
              onSaveGeneratedSentence={onSaveGeneratedSentence}
              onDismissGeneratedSentence={onDismissGeneratedSentence}
              onEditWord={onEditWord}
              updatingWordId={updatingWordId}
              onVerifyWord={onVerifyWord}
              verifyingWordId={verifyingWordId}
              verificationResults={verificationResults}
              onGenerateHanzi={onGenerateHanzi}
              generatingHanziId={generatingHanziId}
              showOrderNumbers={showOrderNumbers}
              onMoveWordToLesson={onMoveWordToLesson}
            />
          </>
        )}
      </PracticeSection>

      <ListenDialog
        open={isListenDialogOpen}
        onClose={handleCloseListenDialog}
        title="Listen to Vocabulary"
        entries={vocabulary}
        currentEntryId={currentAudioId}
        isPlaying={isBatchPlaying}
        pauseMs={listenPauseMs ?? 800}
        pauseMinMs={listenPauseMinMs}
        pauseMaxMs={listenPauseMaxMs}
        pauseStepMs={listenPauseStepMs}
        onPauseChange={onListenPauseChange ?? (() => {})}
        onPlay={onBatchToggle}
        onStop={handleStopPlayback}
      />

      <PracticeSpeakingDialog
        open={isSpeakDialogOpen}
        onClose={handleCloseSpeakDialog}
        title="Practice Speaking - Vocabulary"
        entries={vocabulary}
      />
    </>
  );
};

interface VocabularyListContentProps
  extends Pick<
    VocabularySectionProps,
    | "sentenceMatches"
    | "duplicateVocabularyMap"
    | "sensors"
    | "onDragEnd"
    | "isSavingOrder"
    | "currentAudioId"
    | "deletingWordId"
    | "generatingAudioId"
    | "onPlayWord"
    | "generatedSentenceSuggestions"
    | "generatingSentenceIds"
    | "savingSentenceIds"
    | "sentenceGenerationErrors"
    | "onGenerateSentence"
    | "onSaveGeneratedSentence"
    | "onDismissGeneratedSentence"
    | "onMoveWordToEnd"
    | "onChangeWordOrder"
    | "onDeleteWord"
    | "onRegenerateAudio"
    | "onEditWord"
    | "updatingWordId"
    | "reorderingEnabled"
    | "onVerifyWord"
    | "verifyingWordId"
    | "verificationResults"
    | "onGenerateHanzi"
    | "generatingHanziId"
    | "audioVoices"
    | "showOrderNumbers"
    | "onMoveWordToLesson"
  > {
  vocabulary: PracticeEntry[];
  searchTerm?: string;
}

const VocabularyListContent: React.FC<VocabularyListContentProps> = ({
  vocabulary,
  searchTerm,
  sentenceMatches,
  duplicateVocabularyMap,
  sensors,
  onDragEnd,
  isSavingOrder,
  currentAudioId,
  deletingWordId,
  generatingAudioId,
  audioVoices,
  onPlayWord,
  onGenerateHanzi,
  generatingHanziId,
  onDeleteWord,
  onRegenerateAudio,
  generatedSentenceSuggestions,
  generatingSentenceIds,
  savingSentenceIds,
  sentenceGenerationErrors,
  onGenerateSentence,
  onSaveGeneratedSentence,
  onDismissGeneratedSentence,
  onMoveWordToEnd,
  onChangeWordOrder,
  reorderingEnabled = true,
  onEditWord,
  updatingWordId,
  onVerifyWord,
  verifyingWordId,
  verificationResults,
  showOrderNumbers = true,
  onMoveWordToLesson,
}) => {
  const {
    editingEntry,
    isSavingEdit,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleSaveEdit,
    deletingEntry,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleConfirmDelete,
  } = useEntryDialogs({
    onEdit: onEditWord,
    onDelete: onDeleteWord,
  });

  const normalizedSearch = searchTerm ? toSearchKey(searchTerm) : "";
  const displaySearchTerm = searchTerm?.trim() ?? "";
  const isFiltering = normalizedSearch.length > 0;

  const visibleVocabulary = isFiltering
    ? vocabulary.filter((entry) => {
        const normalizedPinyin = toSearchKey(entry.pinyin);
        const normalizedEnglish = entry.english.trim().toLowerCase();
        return (
          normalizedPinyin.includes(normalizedSearch) ||
          normalizedEnglish.includes(normalizedSearch)
        );
      })
    : vocabulary;

  const orderNumberMap = useMemo(() => {
    return new Map(vocabulary.map((entry, index) => [entry.id, index + 1]));
  }, [vocabulary]);

  if (!visibleVocabulary.length) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        {isFiltering
          ? `No matches for "${displaySearchTerm}"`
          : "No vocabulary entries to display."}
      </Typography>
    );
  }

  const canReorder = reorderingEnabled;
  const baseDragDisabled =
    !canReorder || isSavingOrder || visibleVocabulary.length <= 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={visibleVocabulary.map((vocab) => vocab.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing={2} sx={{ width: "100%" }}>
          {visibleVocabulary.map((vocab) => (
            <SortablePracticeCard
              key={vocab.id}
              entry={vocab}
              matchedSentences={sentenceMatches?.[vocab.id] ?? []}
              duplicateEntries={
                duplicateVocabularyMap?.[vocab.id]?.others ?? []
              }
              generatedSentence={generatedSentenceSuggestions?.[vocab.id]}
              isGeneratingSentence={Boolean(generatingSentenceIds?.[vocab.id])}
              isSavingGeneratedSentence={Boolean(savingSentenceIds?.[vocab.id])}
              generationError={sentenceGenerationErrors?.[vocab.id]}
              onGenerateSentence={
                onGenerateSentence
                  ? () => onGenerateSentence(vocab.id)
                  : undefined
              }
              onSaveGeneratedSentence={
                onSaveGeneratedSentence
                  ? () => onSaveGeneratedSentence(vocab.id)
                  : undefined
              }
              onClearGeneratedSentence={
                onDismissGeneratedSentence
                  ? () => onDismissGeneratedSentence(vocab.id)
                  : undefined
              }
              isActive={currentAudioId === vocab.id}
              isDeleting={deletingWordId === vocab.id}
              isGeneratingAudio={generatingAudioId === vocab.id}
              dragDisabled={isFiltering || baseDragDisabled}
              onPlay={() => onPlayWord(vocab.id)}
              onDelete={
                onDeleteWord ? () => handleOpenDeleteDialog(vocab) : undefined
              }
              onRegenerateAudio={
                onRegenerateAudio
                  ? () => onRegenerateAudio(vocab.id)
                  : undefined
              }
              audioVoice={audioVoices?.[vocab.id]}
              onGenerateHanzi={
                onGenerateHanzi ? () => onGenerateHanzi(vocab.id) : undefined
              }
              isGeneratingHanzi={generatingHanziId === vocab.id}
              onMoveToEnd={
                onMoveWordToEnd ? () => onMoveWordToEnd(vocab.id) : undefined
              }
              onUpdateOrder={
                onChangeWordOrder
                  ? (nextPosition: number) =>
                      onChangeWordOrder(vocab.id, nextPosition)
                  : undefined
              }
              orderNumber={
                showOrderNumbers ? orderNumberMap.get(vocab.id) : undefined
              }
              onOpenEditDialog={
                onEditWord ? () => handleOpenEditDialog(vocab) : undefined
              }
              isUpdating={
                updatingWordId === vocab.id ||
                (editingEntry?.id === vocab.id && isSavingEdit)
              }
              onVerifyPinyin={
                onVerifyWord ? () => onVerifyWord(vocab.id) : undefined
              }
              isVerifying={verifyingWordId === vocab.id}
              verificationResult={verificationResults?.[vocab.id]}
              showDragHandle={reorderingEnabled}
              onMoveToLesson={
                onMoveWordToLesson
                  ? () => onMoveWordToLesson(vocab.id)
                  : undefined
              }
            />
          ))}
        </Stack>
      </SortableContext>

      <EditEntryDialog
        open={Boolean(editingEntry)}
        onClose={handleCloseEditDialog}
        title="Edit Word"
        initialPinyin={editingEntry?.pinyin ?? ""}
        initialEnglish={editingEntry?.english ?? ""}
        onSave={handleSaveEdit}
        isSaving={isSavingEdit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingEntry)}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Word"
        itemName={deletingEntry?.pinyin}
        isDeleting={deletingWordId === deletingEntry?.id}
      />
    </DndContext>
  );
};
