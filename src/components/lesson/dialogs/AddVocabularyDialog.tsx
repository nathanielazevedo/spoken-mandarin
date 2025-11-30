import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Box,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { PracticeEntry } from "../../../types/lesson";

export interface AddVocabularyDialogProps {
  open: boolean;
  isSubmitting: boolean;
  vocabularyList: PracticeEntry[];
  initialValues?: {
    pinyin?: string;
    english?: string;
    insertPosition?: number;
  } | null;
  onClose: () => void;
  onSubmit: (payload: {
    pinyin: string;
    english: string;
    insertPosition: number;
  }) => Promise<void> | void;
}

export const AddVocabularyDialog: React.FC<AddVocabularyDialogProps> = ({
  open,
  isSubmitting,
  vocabularyList,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [pinyin, setPinyin] = React.useState("");
  const [english, setEnglish] = React.useState("");
  const [insertPosition, setInsertPosition] = React.useState(0);
  const [aiSuggestionError, setAiSuggestionError] = React.useState<
    string | null
  >(null);
  const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] =
    React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setPinyin(initialValues?.pinyin ?? "");
    setEnglish(initialValues?.english ?? "");
    setInsertPosition(initialValues?.insertPosition ?? vocabularyList.length);
    setAiSuggestionError(null);
    setIsGeneratingAiSuggestion(false);
  }, [open, initialValues, vocabularyList.length]);

  const trimmedPinyin = pinyin.trim();
  const trimmedEnglish = english.trim();
  const canGenerateEnglish = Boolean(trimmedPinyin) && !trimmedEnglish;
  const canGeneratePinyin = Boolean(trimmedEnglish) && !trimmedPinyin;
  const aiButtonDisabled =
    isGeneratingAiSuggestion || (!canGenerateEnglish && !canGeneratePinyin);
  const aiButtonLabel = isGeneratingAiSuggestion
    ? "Generating..."
    : canGenerateEnglish
    ? "AI fill English"
    : canGeneratePinyin
    ? "AI fill pinyin"
    : "AI generate";

  const handleAiSuggestion = React.useCallback(async () => {
    if (isGeneratingAiSuggestion) {
      return;
    }

    const currentPinyin = pinyin.trim();
    const currentEnglish = english.trim();
    const shouldGenerateEnglish = Boolean(currentPinyin) && !currentEnglish;
    const shouldGeneratePinyin = Boolean(currentEnglish) && !currentPinyin;

    if (!shouldGenerateEnglish && !shouldGeneratePinyin) {
      setAiSuggestionError("Enter either pinyin or English before using AI");
      return;
    }

    setAiSuggestionError(null);
    setIsGeneratingAiSuggestion(true);

    try {
      const response = await fetch("/api/vocabulary/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          shouldGenerateEnglish
            ? { pinyin: currentPinyin }
            : { english: currentEnglish }
        ),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggestion");
      }

      const nextPinyin =
        typeof data.pinyin === "string" && data.pinyin.trim().length
          ? data.pinyin.trim()
          : undefined;
      const nextEnglish =
        typeof data.english === "string" && data.english.trim().length
          ? data.english.trim()
          : undefined;

      setPinyin((prev) => nextPinyin ?? prev);
      setEnglish((prev) => nextEnglish ?? prev);
    } catch (err) {
      setAiSuggestionError(
        (err as Error).message || "Failed to generate suggestion"
      );
    } finally {
      setIsGeneratingAiSuggestion(false);
    }
  }, [english, isGeneratingAiSuggestion, pinyin]);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const currentPinyin = pinyin.trim();
      const currentEnglish = english.trim();

      if (!currentPinyin || !currentEnglish) {
        setAiSuggestionError("Please provide both pinyin and English");
        return;
      }

      await onSubmit({
        pinyin: currentPinyin,
        english: currentEnglish,
        insertPosition,
      });
    },
    [english, insertPosition, onSubmit, pinyin]
  );

  const isSubmitDisabled =
    isSubmitting || !trimmedPinyin.length || !trimmedEnglish.length;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add new vocabulary word</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Pinyin"
              placeholder="nǐ hǎo"
              value={pinyin}
              onChange={(event) => {
                setPinyin(event.target.value);
                setAiSuggestionError(null);
              }}
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="English"
              placeholder="hello"
              value={english}
              onChange={(event) => {
                setEnglish(event.target.value);
                setAiSuggestionError(null);
              }}
              required
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                onClick={handleAiSuggestion}
                disabled={aiButtonDisabled}
                sx={{ display: "flex", gap: 1, alignItems: "center" }}
              >
                {isGeneratingAiSuggestion && (
                  <CircularProgress size={18} color="inherit" thickness={5} />
                )}
                {aiButtonLabel}
              </Button>
              {aiSuggestionError && (
                <Typography variant="body2" color="error">
                  {aiSuggestionError}
                </Typography>
              )}
            </Stack>
            <TextField
              select
              label="Insert position"
              value={insertPosition}
              onChange={(event) =>
                setInsertPosition(Number(event.target.value))
              }
              helperText="Choose where this word should appear in the list"
              fullWidth
            >
              <MenuItem value={0}>At the beginning</MenuItem>
              {vocabularyList.map((vocab, index) => (
                <MenuItem key={vocab.id} value={index + 1}>
                  After {vocab.pinyin} - {vocab.english}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitDisabled}
            sx={{ display: "flex", gap: 1, alignItems: "center" }}
          >
            {isSubmitting && (
              <CircularProgress size={18} color="inherit" thickness={5} />
            )}
            {isSubmitting ? "Adding..." : "Add word"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
