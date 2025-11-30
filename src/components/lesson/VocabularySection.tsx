import React, { useMemo } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  School as FlashcardIcon,
  Psychology as PracticeIcon,
  VolumeUp as VolumeIcon,
  StopCircle as StopIcon,
  AddCircleOutline as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  GraphicEq as AudioWaveIcon,
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
  onPracticeClick: () => void;
  onAddWordClick?: () => void;
  onFlashcardsClick: () => void;
  currentAudioId: string | null;
  deletingWordId: string | null;
  generatingAudioId: string | null;
  missingAudioCount?: number;
  isGeneratingMissingAudio?: boolean;
  onGenerateMissingAudio?: () => void;
  onPlayWord: (id: string) => void;
  onDeleteWord?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
  onMoveWordToEnd?: (id: string) => void;
  onChangeWordOrder?: (id: string, nextPosition: number) => void;
  reorderingEnabled?: boolean;
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
  onFlashcardsClick,
  currentAudioId,
  deletingWordId,
  generatingAudioId,
  missingAudioCount,
  isGeneratingMissingAudio,
  onGenerateMissingAudio,
  onPlayWord,
  onDeleteWord,
  onRegenerateAudio,
  onMoveWordToEnd,
  onChangeWordOrder,
  reorderingEnabled = true,
}) => (
  <PracticeSection
    icon={<FlashcardIcon sx={{ color: "primary.main" }} />}
    title="Vocabulary"
    subtitle={`${vocabulary.length} words`}
    listenButton={{
      label: isBatchPlaying ? "Stop audio" : "Listen to deck",
      icon: isBatchPlaying ? <StopIcon /> : <VolumeIcon />,
      onClick: onBatchToggle,
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
    accordionTitle="Tap to view vocabulary list"
    infoMessage={
      reorderingEnabled && isSavingOrder ? "Saving new order..." : null
    }
    extraActions={
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {onGenerateMissingAudio && (
          <Button
            key="generate-audio"
            variant="outlined"
            startIcon={<AudioWaveIcon />}
            onClick={onGenerateMissingAudio}
            disabled={
              isGeneratingMissingAudio ||
              !missingAudioCount ||
              !vocabulary.length
            }
          >
            {isGeneratingMissingAudio
              ? "Generating audio..."
              : missingAudioCount && missingAudioCount > 0
              ? `Generate audio (${missingAudioCount})`
              : "Generate missing audio"}
          </Button>
        )}
        <Button
          key="flashcards"
          variant="outlined"
          startIcon={<FlashcardIcon />}
          onClick={onFlashcardsClick}
          disabled={!vocabulary.length}
        >
          Flashcards
        </Button>
      </Stack>
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
        />
      </>
    )}
  </PracticeSection>
);

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
    | "reorderingEnabled"
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
  onPlayWord,
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
              dragDisabled={
                isFiltering || baseDragDisabled
              }
              onPlay={() => onPlayWord(vocab.id)}
              onDelete={
                onDeleteWord ? () => onDeleteWord(vocab.id) : undefined
              }
              onRegenerateAudio={
                onRegenerateAudio
                  ? () => onRegenerateAudio(vocab.id)
                  : undefined
              }
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
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
