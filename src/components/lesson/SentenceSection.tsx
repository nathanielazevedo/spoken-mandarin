import React, { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Badge,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  VolumeUp as VolumeIcon,
  Psychology as PracticeIcon,
  AddCircleOutline as AddIcon,
  GraphicEq as AudioWaveIcon,
  Translate as TranslateIcon,
  Mic as MicIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";
import { PracticeSection } from "./PracticeSection";
import { SortablePracticeCard } from "./SortablePracticeCard";
import { EditEntryDialog } from "./EditEntryDialog";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ListenDialog } from "./ListenDialog";
import { PracticeSpeakingDialog } from "./PracticeSpeakingDialog";
import { useEntryDialogs } from "../../hooks/useEntryDialogs";

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
  onStopPlayback?: () => void;
  showSentenceIndices?: boolean;
  onMoveSentenceToLesson?: (id: string) => void;
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
  onStopPlayback,
  showSentenceIndices = true,
  onMoveSentenceToLesson,
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
    onEdit: onEditSentence,
    onDelete: onDeleteSentence,
  });

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
        title="Sentences"
        subtitle={`${sentences.length} sentences`}
        listenButton={{
          label: "Listen to deck",
          icon: <VolumeIcon />,
          onClick: handleOpenListenDialog,
          disabled: !sentences.length,
        }}
        practiceButton={{
          label: "Practice",
          icon: <PracticeIcon />,
          onClick: onPracticeClick,
          disabled: !sentences.length,
        }}
        speakButton={{
          label: "Practice Speaking",
          icon: <MicIcon />,
          onClick: handleOpenSpeakDialog,
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
                    isGeneratingAudio={
                      generatingSentenceAudioId === sentence.id
                    }
                    dragDisabled={
                      !reorderingEnabled ||
                      isSavingOrder ||
                      sentences.length <= 1
                    }
                    onPlay={() => onPlaySentence(sentence.id)}
                    onDelete={
                      onDeleteSentence
                        ? () => handleOpenDeleteDialog(sentence)
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
                    onOpenEditDialog={
                      onEditSentence
                        ? () => handleOpenEditDialog(sentence)
                        : undefined
                    }
                    isUpdating={
                      updatingSentenceId === sentence.id ||
                      (editingEntry?.id === sentence.id && isSavingEdit)
                    }
                    showDragHandle={reorderingEnabled}
                    onMoveToLesson={
                      onMoveSentenceToLesson
                        ? () => onMoveSentenceToLesson(sentence.id)
                        : undefined
                    }
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}

        <EditEntryDialog
          open={Boolean(editingEntry)}
          onClose={handleCloseEditDialog}
          title="Edit Sentence"
          initialPinyin={editingEntry?.pinyin ?? ""}
          initialEnglish={editingEntry?.english ?? ""}
          onSave={handleSaveEdit}
          isSaving={isSavingEdit}
        />

        <ConfirmDeleteDialog
          open={Boolean(deletingEntry)}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          title="Delete Sentence"
          itemName={deletingEntry?.pinyin}
          isDeleting={deletingSentenceId === deletingEntry?.id}
        />
      </PracticeSection>

      <ListenDialog
        open={isListenDialogOpen}
        onClose={handleCloseListenDialog}
        title="Listen to Sentences"
        entries={sentences}
        currentEntryId={currentSentenceAudioId}
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
        title="Practice Speaking - Sentences"
        entries={sentences}
      />
    </>
  );
};
