import React, { useEffect, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Button,
  Collapse,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  TextField,
} from "@mui/material";
import {
  Audiotrack as AudiotrackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  KeyboardDoubleArrowDown as MoveToEndIcon,
  Translate as TranslateIcon,
  Spellcheck as SpellcheckIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";
import { normalizePinyinWord } from "../../utils/pinyin";

export interface SortablePracticeCardProps {
  entry: PracticeEntry;
  subtitle?: string;
  matchedSentences?: PracticeEntry[];
  duplicateEntries?: PracticeEntry[];
  generatedSentence?: { pinyin: string; english: string };
  isActive: boolean;
  isDeleting: boolean;
  isGeneratingAudio: boolean;
  dragDisabled: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  onRegenerateAudio?: () => void;
  audioVoice?: string;
  onGenerateSentence?: () => void;
  onSaveGeneratedSentence?: () => void;
  onClearGeneratedSentence?: () => void;
  isGeneratingSentence?: boolean;
  isSavingGeneratedSentence?: boolean;
  generationError?: string;
  vocabularyWordSet?: Set<string>;
  onMissingWordClick?: (word: string) => void;
  onMoveToEnd?: () => void;
  onUpdateOrder?: (nextPosition: number) => void;
  orderNumber?: number;
  onEditEntry?: (payload: {
    pinyin: string;
    english: string;
  }) => Promise<void> | void;
  isUpdating?: boolean;
  onVerifyPinyin?: () => void;
  isVerifying?: boolean;
  verificationResult?: {
    status: "success" | "error";
    message: string | null;
  };
  onGenerateHanzi?: () => Promise<void> | void;
  isGeneratingHanzi?: boolean;
  showDragHandle?: boolean;
}

export const SortablePracticeCard: React.FC<SortablePracticeCardProps> = ({
  entry,
  subtitle,
  matchedSentences,
  duplicateEntries,
  generatedSentence,
  isActive,
  isDeleting,
  isGeneratingAudio,
  dragDisabled,
  onPlay,
  onDelete,
  onRegenerateAudio,
  audioVoice,
  onGenerateSentence,
  onSaveGeneratedSentence,
  onClearGeneratedSentence,
  isGeneratingSentence,
  isSavingGeneratedSentence,
  generationError,
  vocabularyWordSet,
  onMissingWordClick,
  onMoveToEnd,
  onUpdateOrder,
  orderNumber,
  onEditEntry,
  isUpdating,
  onVerifyPinyin,
  isVerifying,
  verificationResult,
  onGenerateHanzi,
  isGeneratingHanzi,
  showDragHandle = true,
}) => {
  const [isEditingWord, setIsEditingWord] = useState(false);
  const [editPinyin, setEditPinyin] = useState(entry.pinyin);
  const [editEnglish, setEditEnglish] = useState(entry.english);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: dragDisabled });

  const inlineStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition || undefined,
    opacity: isDragging ? 0.9 : 1,
    willChange: transform ? "transform" : undefined,
  };

  const sentenceMatches = matchedSentences ?? [];
  const duplicateMatches = duplicateEntries ?? [];
  const [isMatchesOpen, setIsMatchesOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderInput, setOrderInput] = useState(orderNumber?.toString() ?? "");
  const hasAudio = Boolean(entry.audioUrl && entry.audioUrl.trim());
  const hasSentenceMatches = sentenceMatches.length > 0;
  const isHanziMissing = !entry.hanzi?.trim();
  const isMatchesVisible = hasSentenceMatches && isMatchesOpen;
  const highlightedPinyinSegments = useMemo(() => {
    if (!vocabularyWordSet) {
      return null;
    }
    const segments = entry.pinyin.split(/(\s+)/);
    return segments.map((text) => {
      if (!text.trim()) {
        return { text, highlight: false };
      }
      const normalized = normalizePinyinWord(text);
      if (!normalized) {
        return { text, highlight: false };
      }
      return { text, highlight: !vocabularyWordSet.has(normalized) };
    });
  }, [entry.pinyin, vocabularyWordSet]);

  useEffect(() => {
    if (!isEditingOrder && typeof orderNumber === "number") {
      setOrderInput(orderNumber.toString());
    }
  }, [isEditingOrder, orderNumber]);

  useEffect(() => {
    if (!isEditingWord) {
      setEditPinyin(entry.pinyin);
      setEditEnglish(entry.english);
    }
  }, [entry.english, entry.pinyin, isEditingWord]);

  const handleStartEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditError(null);
    setEditPinyin(entry.pinyin);
    setEditEnglish(entry.english);
    setIsEditingWord(true);
  };

  const handleCancelEdit = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    setIsEditingWord(false);
    setEditError(null);
    setEditPinyin(entry.pinyin);
    setEditEnglish(entry.english);
    setIsSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!onEditEntry) {
      setIsEditingWord(false);
      return;
    }

    const trimmedPinyin = editPinyin.trim();
    const trimmedEnglish = editEnglish.trim();

    if (!trimmedPinyin || !trimmedEnglish) {
      setEditError("Enter both pinyin and English");
      return;
    }

    setEditError(null);
    setIsSavingEdit(true);

    try {
      await onEditEntry({ pinyin: trimmedPinyin, english: trimmedEnglish });
      setIsEditingWord(false);
    } catch (err) {
      setEditError((err as Error).message || "Failed to update word");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const editingDisabled = isUpdating || isSavingEdit;
  const dragHandleListeners = isEditingWord ? undefined : listeners;

  const handleOrderChipClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditingOrder(true);
    setOrderInput(orderNumber?.toString() ?? "");
  };

  const handleOrderSubmit = () => {
    if (!onUpdateOrder) {
      setIsEditingOrder(false);
      return;
    }
    const parsed = Number(orderInput);
    if (!Number.isFinite(parsed)) {
      setIsEditingOrder(false);
      return;
    }
    onUpdateOrder(parsed);
    setIsEditingOrder(false);
  };

  const handleOrderInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleOrderSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsEditingOrder(false);
      setOrderInput(orderNumber?.toString() ?? "");
    }
  };

  const handleToggleMatches = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMatchesOpen((prev) => !prev);
  };

  const handleGenerateClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isGeneratingSentence && onGenerateSentence) {
      onGenerateSentence();
    }
  };

  const handleSaveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSaveGeneratedSentence?.();
  };

  const handleDismissClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClearGeneratedSentence?.();
  };

  const shouldShowDragHandle = showDragHandle;
  const hasActionIcons =
    shouldShowDragHandle ||
    Boolean(onMoveToEnd) ||
    Boolean(onVerifyPinyin) ||
    Boolean(onRegenerateAudio) ||
    Boolean(onEditEntry) ||
    Boolean(onGenerateSentence) ||
    Boolean(onGenerateHanzi) ||
    Boolean(onDelete);

  return (
    <Box
      ref={setNodeRef}
      style={inlineStyle}
      sx={{
        position: "relative",
        width: "100%",
        p: 2,
        border: "1px solid",
        borderColor: isActive ? "primary.main" : "divider",
        borderRadius: 2,
        backgroundColor: isActive ? "action.selected" : "background.default",
        boxShadow: isActive ? 3 : 0,
        cursor: isEditingWord ? "default" : "pointer",
      }}
      onClick={isEditingWord ? undefined : onPlay}
    >
      {hasActionIcons && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            alignItems: "center",
          }}
        >
          {shouldShowDragHandle && (
            <Tooltip
              title={dragDisabled ? "Reordering disabled" : "Drag to reorder"}
            >
              <span>
                <IconButton
                  size="small"
                  disabled={dragDisabled}
                  {...attributes}
                  {...(dragHandleListeners ?? {})}
                  sx={{
                    color: "text.secondary",
                    cursor: dragDisabled ? "not-allowed" : "grab",
                  }}
                >
                  <DragIndicatorIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onMoveToEnd && (
            <Tooltip title="Send to end">
              <span>
                <IconButton
                  size="small"
                  disabled={dragDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveToEnd();
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  <MoveToEndIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onVerifyPinyin && (
            <Tooltip title="Verify pinyin">
              <span>
                <IconButton
                  size="small"
                  disabled={Boolean(isVerifying)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onVerifyPinyin();
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {isVerifying ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : (
                    <SpellcheckIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onGenerateHanzi && (
            <Tooltip
              title={entry.hanzi ? "Refresh characters" : "Fetch characters"}
            >
              <span>
                <IconButton
                  size="small"
                  disabled={Boolean(isGeneratingHanzi)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onGenerateHanzi();
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {isGeneratingHanzi ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : (
                    <TranslateIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onRegenerateAudio && (
            <Tooltip title="Regenerate audio">
              <span>
                <IconButton
                  size="small"
                  disabled={isGeneratingAudio}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRegenerateAudio();
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {isGeneratingAudio ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : (
                    <AudiotrackIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onEditEntry && (
            <Tooltip title={isEditingWord ? "Close editor" : "Edit word"}>
              <span>
                <IconButton
                  size="small"
                  disabled={editingDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isEditingWord) {
                      handleCancelEdit(event);
                    } else {
                      handleStartEdit(event);
                    }
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {editingDisabled ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : isEditingWord ? (
                    <CloseIcon fontSize="small" />
                  ) : (
                    <EditIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onGenerateSentence && (
            <Tooltip
              title={
                generatedSentence ? "Regenerate sentence" : "Generate sentence"
              }
            >
              <span>
                <IconButton
                  size="small"
                  disabled={Boolean(isSavingGeneratedSentence)}
                  onClick={handleGenerateClick}
                  sx={{ color: "text.secondary" }}
                >
                  {isGeneratingSentence ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : (
                    <AutoAwesomeIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  disabled={isDeleting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {isDeleting ? (
                    <CircularProgress size={16} thickness={5} />
                  ) : (
                    <DeleteIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      )}
      {(subtitle || typeof orderNumber === "number") && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {typeof orderNumber === "number" && !isEditingOrder && (
            <Chip
              size="small"
              label={`#${orderNumber}`}
              variant="outlined"
              sx={{
                fontWeight: 600,
                cursor: onUpdateOrder ? "pointer" : undefined,
              }}
              onClick={onUpdateOrder ? handleOrderChipClick : undefined}
              onMouseDown={(event) => event.stopPropagation()}
            />
          )}
          {typeof orderNumber === "number" && isEditingOrder && (
            <TextField
              size="small"
              autoFocus
              value={orderInput}
              onChange={(event) => setOrderInput(event.target.value)}
              onBlur={handleOrderSubmit}
              onKeyDown={handleOrderInputKeyDown}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                min: 1,
                style: { width: 56, textAlign: "center" },
              }}
              sx={{ width: 70 }}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          {subtitle && (
            <Typography variant="subtitle2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {!hasAudio && (
            <Chip
              size="small"
              label="Audio missing"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {audioVoice && (
            <Chip
              size="small"
              label={`Voice: ${audioVoice}`}
              color="default"
              variant="outlined"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          )}
          {isHanziMissing && (
            <Chip
              size="small"
              label="Chars missing"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      )}
      {isEditingWord ? (
        <Stack spacing={1} sx={{ pr: 8 }}>
          <TextField
            label="Pinyin"
            size="small"
            value={editPinyin}
            onChange={(event) => setEditPinyin(event.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="English"
            size="small"
            value={editEnglish}
            onChange={(event) => setEditEnglish(event.target.value)}
            fullWidth
          />
          {editError && (
            <Typography variant="caption" color="error">
              {editError}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="contained"
              onClick={(event) => {
                event.stopPropagation();
                void handleSaveEdit();
              }}
              disabled={editingDisabled}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Save
              {(isSavingEdit || isUpdating) && (
                <CircularProgress size={16} thickness={5} />
              )}
            </Button>
            <Button
              size="small"
              onClick={(event) => handleCancelEdit(event)}
              disabled={editingDisabled}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      ) : (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ pr: 8 }}>
            {highlightedPinyinSegments
              ? highlightedPinyinSegments.map((segment, index) => {
                  const trimmedWord = segment.text.trim();
                  const isClickable = Boolean(
                    segment.highlight && trimmedWord && onMissingWordClick
                  );

                  const handleClick = (
                    event: React.MouseEvent<HTMLSpanElement>
                  ) => {
                    if (!isClickable || !trimmedWord) {
                      return;
                    }
                    event.stopPropagation();
                    onMissingWordClick?.(trimmedWord);
                  };

                  const handleKeyDown = (
                    event: React.KeyboardEvent<HTMLSpanElement>
                  ) => {
                    if (!isClickable || !trimmedWord) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onMissingWordClick?.(trimmedWord);
                    }
                  };

                  return (
                    <Box
                      component="span"
                      key={`${entry.id}-segment-${index}`}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onClick={isClickable ? handleClick : undefined}
                      onKeyDown={isClickable ? handleKeyDown : undefined}
                      sx={{
                        ...(segment.highlight
                          ? { color: "error.main", fontWeight: 700 }
                          : undefined),
                        ...(isClickable
                          ? {
                              cursor: "pointer",
                              textDecoration: "underline dotted",
                            }
                          : undefined),
                      }}
                    >
                      {segment.text}
                    </Box>
                  );
                })
              : entry.pinyin}
          </Typography>
          <Typography variant="body1" sx={{ pr: 8 }}>
            {entry.english}
          </Typography>
          {verificationResult && (
            <Tooltip
              title={
                verificationResult.message ||
                (verificationResult.status === "success"
                  ? "Pinyin and hanzi verified"
                  : "Verification issue")
              }
            >
              <Chip
                size="small"
                label={
                  verificationResult.status === "success"
                    ? "Pinyin & hanzi verified"
                    : "Needs review"
                }
                color={
                  verificationResult.status === "success" ? "success" : "error"
                }
                variant="outlined"
                sx={{ alignSelf: "flex-start", mt: 1 }}
              />
            </Tooltip>
          )}
        </>
      )}
      {duplicateMatches.length > 0 && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            borderRadius: 1.5,
            border: "1px dashed",
            borderColor: "warning.light",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 193, 7, 0.08)"
                : "rgba(255, 193, 7, 0.08)",
          }}
        >
          <Chip
            label="Duplicate pinyin"
            size="small"
            color="warning"
            sx={{ mb: 0.75 }}
          />
          <Typography variant="body2" sx={{ color: "warning.dark" }}>
            Matches:
          </Typography>
          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
            {duplicateMatches.map((duplicate) => (
              <Typography variant="body2" key={duplicate.id}>
                {duplicate.pinyin} — {duplicate.english}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
      {generationError && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {generationError}
        </Typography>
      )}
      {generatedSentence && (
        <Box
          sx={{
            mt: 1,
            p: 1.25,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1.5,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            AI suggestion
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
            {generatedSentence.pinyin}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {generatedSentence.english}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            {onSaveGeneratedSentence && (
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveClick}
                disabled={Boolean(isSavingGeneratedSentence)}
              >
                Save sentence
                {isSavingGeneratedSentence && (
                  <CircularProgress size={16} thickness={5} sx={{ ml: 1 }} />
                )}
              </Button>
            )}
            {onGenerateSentence && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleGenerateClick}
                disabled={Boolean(isGeneratingSentence)}
              >
                Regenerate
              </Button>
            )}
            {onClearGeneratedSentence && (
              <Button size="small" onClick={handleDismissClick}>
                Dismiss
              </Button>
            )}
          </Stack>
        </Box>
      )}
      {hasSentenceMatches && (
        <Chip
          label={`${sentenceMatches.length} sentence${
            sentenceMatches.length === 1 ? "" : "s"
          }`}
          size="small"
          color={isMatchesVisible ? "primary" : "default"}
          variant={isMatchesVisible ? "filled" : "outlined"}
          sx={{ mt: 1, alignSelf: "flex-start" }}
          onClick={handleToggleMatches}
          onMouseDown={(event) => event.stopPropagation()}
        />
      )}
      {hasSentenceMatches && (
        <Collapse in={isMatchesVisible} timeout="auto" unmountOnExit>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {sentenceMatches.map((sentence) => (
              <Box
                key={sentence.id}
                sx={{
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  pl: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {sentence.pinyin}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sentence.english}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
};
