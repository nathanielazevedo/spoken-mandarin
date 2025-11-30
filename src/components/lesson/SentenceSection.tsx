import React from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Stack, Typography } from "@mui/material";
import {
  Chat as ConversationIcon,
  Psychology as PracticeIcon,
  VolumeUp as VolumeIcon,
  StopCircle as StopIcon,
  AddCircleOutline as AddIcon,
  School as FlashcardIcon,
  GraphicEq as AudioWaveIcon,
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
  onPracticeClick: () => void;
  onAddSentenceClick?: () => void;
  onFlashcardsClick: () => void;
  currentSentenceAudioId: string | null;
  deletingSentenceId: string | null;
  generatingSentenceAudioId: string | null;
  missingAudioCount?: number;
  isGeneratingMissingAudio?: boolean;
  onGenerateMissingAudio?: () => void;
  onPlaySentence: (sentenceId: string) => void;
  onDeleteSentence?: (sentenceId: string) => void;
  onRegenerateAudio?: (sentenceId: string) => void;
  reorderingEnabled?: boolean;
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
  onPracticeClick,
  onAddSentenceClick,
  onFlashcardsClick,
  currentSentenceAudioId,
  deletingSentenceId,
  generatingSentenceAudioId,
  missingAudioCount,
  isGeneratingMissingAudio,
  onGenerateMissingAudio,
  onPlaySentence,
  onDeleteSentence,
  onRegenerateAudio,
  reorderingEnabled = true,
}) => (
  <PracticeSection
    icon={<ConversationIcon sx={{ color: "primary.main" }} />}
    title="Lesson sentences"
    subtitle={`${sentences.length} ready-made lines to reuse like vocabulary.`}
    listenButton={{
      label: isBatchPlaying ? "Stop audio" : "Listen to deck",
      icon: isBatchPlaying ? <StopIcon /> : <VolumeIcon />,
      onClick: onBatchToggle,
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
    accordionTitle="Tap to review each sentence"
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
              !sentences.length
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
          disabled={!sentences.length}
        >
          Flashcards
        </Button>
      </Stack>
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
                subtitle={`Sentence ${index + 1}`}
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
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
    )}
  </PracticeSection>
);
