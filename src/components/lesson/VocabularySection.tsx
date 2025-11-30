import React, { useMemo } from "react";
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
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Psychology as PracticeIcon,
  VolumeUp as VolumeIcon,
  StopCircle as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  AddCircleOutline as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  GraphicEq as AudioWaveIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";
import { PracticeSection } from "./PracticeSection";
import { SortablePracticeCard } from "./SortablePracticeCard";

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
  onListenButtonClick: () => void;
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
  showListenControls?: boolean;
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
  onListenButtonClick,
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
  showListenControls = false,
}) => {
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
  const showListenPauseControl =
    showListenControls &&
    typeof listenPauseMs === "number" &&
    Boolean(onListenPauseChange);
  const listenPauseLabelSeconds =
    typeof listenPauseMs === "number"
      ? (listenPauseMs / 1000).toFixed(1)
      : "0.0";

  return (
    <PracticeSection
      title="Vocabulary"
      subtitle={`${vocabulary.length} words`}
      listenButton={{
        label: showListenControls ? "Hide listen controls" : "Listen to deck",
        icon: showListenControls ? <StopIcon /> : <VolumeIcon />,
        onClick: onListenButtonClick,
        disabled: !vocabulary.length,
      }}
      practiceButton={{
        label: "Practice",
        icon: <PracticeIcon />,
        onClick: onPracticeClick,
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
      listenControls={
        showListenPauseControl && onListenPauseChange ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: "100%" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Pause {listenPauseLabelSeconds}s between words
              </Typography>
              <Slider
                size="small"
                value={listenPauseMs}
                min={listenPauseMinMs ?? 0}
                max={listenPauseMaxMs ?? 3000}
                step={listenPauseStepMs ?? 100}
                onChange={(_, value) => {
                  if (typeof value === "number") {
                    onListenPauseChange(value);
                  }
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value / 1000).toFixed(1)}s`}
              />
            </Box>
            <Tooltip title={isBatchPlaying ? "Pause deck" : "Play deck"}>
              <span>
                <IconButton
                  color="primary"
                  onClick={onBatchToggle}
                  disabled={!vocabulary.length}
                  aria-label={isBatchPlaying ? "Pause deck" : "Play deck"}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    width: 48,
                    height: 48,
                  }}
                >
                  {isBatchPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ) : undefined
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
                      <Badge color="secondary" badgeContent={missingAudioCount}>
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
                      <Badge color="secondary" badgeContent={missingHanziCount}>
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
          />
        </>
      )}
    </PracticeSection>
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
}) => {
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
              onDelete={onDeleteWord ? () => onDeleteWord(vocab.id) : undefined}
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
              orderNumber={orderNumberMap.get(vocab.id)}
              onEditEntry={
                onEditWord
                  ? (payload: { pinyin: string; english: string }) =>
                      onEditWord(vocab.id, payload)
                  : undefined
              }
              isUpdating={updatingWordId === vocab.id}
              onVerifyPinyin={
                onVerifyWord ? () => onVerifyWord(vocab.id) : undefined
              }
              isVerifying={verifyingWordId === vocab.id}
              verificationResult={verificationResults?.[vocab.id]}
              showDragHandle={reorderingEnabled}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
