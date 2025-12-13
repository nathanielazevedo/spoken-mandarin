import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";

export interface EditEntryDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  initialPinyin: string;
  initialEnglish: string;
  onSave: (payload: {
    pinyin: string;
    english: string;
  }) => Promise<void> | void;
  isSaving?: boolean;
}

export const EditEntryDialog: React.FC<EditEntryDialogProps> = ({
  open,
  onClose,
  title = "Edit Entry",
  initialPinyin,
  initialEnglish,
  onSave,
  isSaving = false,
}) => {
  const [pinyin, setPinyin] = useState(initialPinyin);
  const [english, setEnglish] = useState(initialEnglish);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens with new values
  useEffect(() => {
    if (open) {
      setPinyin(initialPinyin);
      setEnglish(initialEnglish);
      setError(null);
    }
  }, [open, initialPinyin, initialEnglish]);

  const handleSave = async () => {
    const trimmedPinyin = pinyin.trim();
    const trimmedEnglish = english.trim();

    if (!trimmedPinyin) {
      setError("Pinyin is required");
      return;
    }
    if (!trimmedEnglish) {
      setError("English is required");
      return;
    }

    setError(null);

    try {
      await onSave({ pinyin: trimmedPinyin, english: trimmedEnglish });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to save");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      void handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Pinyin"
            value={pinyin}
            onChange={(e) => setPinyin(e.target.value)}
            fullWidth
            autoFocus
            disabled={isSaving}
          />
          <TextField
            label="English"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            fullWidth
            disabled={isSaving}
          />
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
