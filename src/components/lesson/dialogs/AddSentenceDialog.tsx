import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline as AddIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../../types/lesson";

export interface AddSentenceDialogProps {
  open: boolean;
  isSubmitting: boolean;
  sentences: PracticeEntry[];
  onClose: () => void;
  onSubmit: (payload: {
    pinyin: string;
    english: string;
    insertPosition: number;
  }) => Promise<void> | void;
}

export const AddSentenceDialog: React.FC<AddSentenceDialogProps> = ({
  open,
  isSubmitting,
  sentences,
  onClose,
  onSubmit,
}) => {
  const [pinyin, setPinyin] = React.useState("");
  const [english, setEnglish] = React.useState("");
  const [insertPosition, setInsertPosition] = React.useState(0);
  const [translationError, setTranslationError] = React.useState<string | null>(
    null
  );
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setPinyin("");
    setEnglish("");
    setInsertPosition(sentences.length);
    setTranslationError(null);
    setIsTranslating(false);
  }, [open, sentences.length]);

  const handleRequestAiTranslation = React.useCallback(async () => {
    const trimmedEnglish = english.trim();
    if (!trimmedEnglish || isTranslating) {
      if (!trimmedEnglish) {
        setTranslationError("Enter an English sentence first");
      }
      return;
    }

    setTranslationError(null);
    setIsTranslating(true);

    try {
      const response = await fetch("/api/sentences/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ english: trimmedEnglish }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to translate sentence");
      }

      const translatedPinyin =
        typeof data.pinyin === "string" ? data.pinyin.trim() : "";

      if (!translatedPinyin) {
        throw new Error("OpenAI response missing pinyin");
      }

      setPinyin(translatedPinyin);
    } catch (err) {
      setTranslationError(
        (err as Error).message || "Failed to translate sentence"
      );
    } finally {
      setIsTranslating(false);
    }
  }, [english, isTranslating]);

  const positionOptions = React.useMemo(
    () => [
      { key: "start", value: 0, label: "At the beginning" },
      ...sentences.map((sentence, index) => ({
        key: sentence.id,
        value: index + 1,
        label: `After sentence ${index + 1}: ${sentence.english}`,
      })),
    ],
    [sentences]
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedPinyin = pinyin.trim();
      const trimmedEnglish = english.trim();

      if (!trimmedPinyin || !trimmedEnglish) {
        setTranslationError("Please provide both pinyin and English");
        return;
      }

      await onSubmit({
        pinyin: trimmedPinyin,
        english: trimmedEnglish,
        insertPosition,
      });
    },
    [english, insertPosition, onSubmit, pinyin]
  );

  const isSubmitDisabled =
    isSubmitting || !pinyin.trim().length || !english.trim().length;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add new sentence</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Pinyin"
              placeholder="wǒ jiào..."
              value={pinyin}
              onChange={(event) => {
                setPinyin(event.target.value);
                setTranslationError(null);
              }}
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="English"
              placeholder="My name is..."
              value={english}
              onChange={(event) => {
                setEnglish(event.target.value);
                setTranslationError(null);
              }}
              required
              fullWidth
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                variant="outlined"
                startIcon={
                  isTranslating ? (
                    <CircularProgress size={18} color="inherit" thickness={5} />
                  ) : (
                    <TranslateIcon />
                  )
                }
                onClick={handleRequestAiTranslation}
                disabled={isTranslating || !english.trim().length}
              >
                {isTranslating ? "Working..." : "Natural Mandarin (AI)"}
              </Button>
              {translationError && (
                <Typography variant="body2" color="error">
                  {translationError}
                </Typography>
              )}
              {!translationError && (
                <Typography variant="caption" color="text.secondary">
                  Gets a native-sounding phrasing instead of a literal
                  translation.
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
              helperText="Choose where this sentence should appear"
              fullWidth
            >
              {positionOptions.map((option) => (
                <MenuItem key={option.key} value={option.value}>
                  {option.label}
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
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" thickness={5} />
              ) : (
                <AddIcon />
              )
            }
          >
            {isSubmitting ? "Adding..." : "Add sentence"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
