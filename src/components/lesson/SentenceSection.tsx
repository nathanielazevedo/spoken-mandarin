import React from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Badge,
  Box,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  VolumeUp as VolumeIcon,
  StopCircle as StopIcon,
  Psychology as PracticeIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  AddCircleOutline as AddIcon,
  GraphicEq as AudioWaveIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";
import { PracticeSection } from "./PracticeSection";
import { SortablePracticeCard } from "./SortablePracticeCard";

type DndSensors = NonNullable<Parameters<typeof DndContext>[0]["sensors"]>;

export interface SentenceSectionProps {
  sentences: PracticeEntry[];
  vocabularyWordSet?: Set<string>;
  onMissingWordClick?: (word: string) => void;
  sensors: DndSensors;
  onDragEnd?: (event: DragEndEvent) => void;
  isSavingOrder: boolean;
  isBatchPlaying: boolean;
  onBatchToggle: () => void;
  onListenButtonClick: () => void;
  onPracticeClick: () => void;
  onAddSentenceClick?: () => void;
  onFlashcardsClick: () => void;
  currentSentenceAudioId: string | null;
  deletingSentenceId: string | null;
  generatingSentenceAudioId: string | null;
  missingAudioCount?: number;
  isGeneratingMissingAudio?: boolean;
  onGenerateMissingAudio?: () => void;
  missingHanziCount?: number;
  isGeneratingMissingHanzi?: boolean;
  onGenerateMissingHanzi?: () => void;
  onPlaySentence: (sentenceId: string) => void;
  onDeleteSentence?: (sentenceId: string) => void;
  onRegenerateAudio?: (sentenceId: string) => void;
  onGenerateHanzi?: (sentenceId: string) => void;
  generatingHanziId?: string | null;
  audioVoices?: Record<string, string>;
  onEditSentence?: (
    id: string,
    payload: { pinyin: string; english: string }
  ) => Promise<void> | void;
  updatingSentenceId?: string | null;
  reorderingEnabled?: boolean;
  listenPauseMs?: number;
  listenPauseMinMs?: number;
  listenPauseMaxMs?: number;
  listenPauseStepMs?: number;
  onListenPauseChange?: (value: number) => void;
  showListenControls?: boolean;
  showSentenceIndices?: boolean;
}

export const SentenceSection: React.FC<SentenceSectionProps> = ({
  sentences,
  vocabularyWordSet,
  onMissingWordClick,
  sensors,
  onDragEnd,
  isSavingOrder,
  isBatchPlaying,
  onBatchToggle,
  onListenButtonClick,
  onPracticeClick,
  onAddSentenceClick,
  currentSentenceAudioId,
  deletingSentenceId,
  generatingSentenceAudioId,
  missingAudioCount,
  isGeneratingMissingAudio,
  onGenerateMissingAudio,
  missingHanziCount,
  isGeneratingMissingHanzi,
  onGenerateMissingHanzi,
  onPlaySentence,
  onDeleteSentence,
  onRegenerateAudio,
  onGenerateHanzi,
  generatingHanziId,
  audioVoices,
  onEditSentence,
  updatingSentenceId,
  reorderingEnabled = true,
  listenPauseMs,
  listenPauseMinMs,
  listenPauseMaxMs,
  listenPauseStepMs,
  onListenPauseChange,
  showListenControls = false,
  showSentenceIndices = true,
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
      title="Sentences"
      subtitle={`${sentences.length} sentences`}
      listenButton={{
        label: showListenControls ? "Hide listen controls" : "Listen to deck",
        icon: showListenControls ? <StopIcon /> : <VolumeIcon />,
        onClick: onListenButtonClick,
        disabled: !sentences.length,
      }}
      practiceButton={{
        label: "Practice",
        icon: <PracticeIcon />,
        onClick: onPracticeClick,
        disabled: !sentences.length,
      }}
      addButton={
        onAddSentenceClick
          ? {
              label: "Add sentence",
              icon: <AddIcon />,
              onClick: onAddSentenceClick,
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
                Pause {listenPauseLabelSeconds}s between sentences
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
                  disabled={!sentences.length}
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
                      !sentences.length
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
                      !sentences.length
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
      {sentences.length === 0 ? (
        <Typography color="text.secondary">
          No sentences available yet.
        </Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={reorderingEnabled ? onDragEnd : undefined}
        >
          <SortableContext
            items={sentences.map((sentence) => sentence.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={2} sx={{ width: "100%" }}>
              {sentences.map((sentence, index) => (
                <SortablePracticeCard
                  key={sentence.id}
                  entry={sentence}
                  subtitle={
                    showSentenceIndices ? `Sentence ${index + 1}` : undefined
                  }
                  vocabularyWordSet={vocabularyWordSet}
                  onMissingWordClick={onMissingWordClick}
                  isActive={currentSentenceAudioId === sentence.id}
                  isDeleting={deletingSentenceId === sentence.id}
                  isGeneratingAudio={generatingSentenceAudioId === sentence.id}
                  dragDisabled={
                    !reorderingEnabled || isSavingOrder || sentences.length <= 1
                  }
                  onPlay={() => onPlaySentence(sentence.id)}
                  onDelete={
                    onDeleteSentence
                      ? () => onDeleteSentence(sentence.id)
                      : undefined
                  }
                  onRegenerateAudio={
                    onRegenerateAudio
                      ? () => onRegenerateAudio(sentence.id)
                      : undefined
                  }
                  onGenerateHanzi={
                    onGenerateHanzi
                      ? () => onGenerateHanzi(sentence.id)
                      : undefined
                  }
                  isGeneratingHanzi={generatingHanziId === sentence.id}
                  audioVoice={audioVoices?.[sentence.id]}
                  onEditEntry={
                    onEditSentence
                      ? (payload: { pinyin: string; english: string }) =>
                          onEditSentence(sentence.id, payload)
                      : undefined
                  }
                  isUpdating={updatingSentenceId === sentence.id}
                  showDragHandle={reorderingEnabled}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </PracticeSection>
  );
};
