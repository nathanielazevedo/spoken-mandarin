import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  TextField,
} from "@mui/material";

export interface BulkUploadCounts {
  vocabulary: number;
  sentences: number;
}

export interface BulkUploadDialogProps {
  open: boolean;
  isUploading: boolean;
  selectedFilename: string | null;
  error: string | null;
  successMessage: string | null;
  counts: BulkUploadCounts | null;
  onClose: () => void;
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onJsonPasted: (jsonText: string) => void;
}

const SAMPLE_JSON = `{
  "vocabulary": [
    { "pinyin": "nǐ hǎo", "english": "hello" }
  ],
  "sentences": [
    { "pinyin": "nǐ hǎo ma?", "english": "How are you?" }
  ]
}`;

export const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({
  open,
  isUploading,
  selectedFilename,
  error,
  successMessage,
  counts,
  onClose,
  onFileSelected,
  onJsonPasted,
}) => {
  const [pastedJson, setPastedJson] = React.useState("");
  const [pasteError, setPasteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setPastedJson("");
      setPasteError(null);
    }
  }, [open]);

  const handlePasteSubmit = () => {
    const trimmed = pastedJson.trim();
    if (!trimmed) {
      setPasteError("Paste JSON content first");
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch (error) {
      setPasteError("Invalid JSON format");
      return;
    }
    setPasteError(null);
    onJsonPasted(trimmed);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Bulk upload from JSON</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Provide a JSON file that includes optional <code>vocabulary</code> and
          <code>sentences</code> arrays. Each entry must contain both pinyin and
          English text, and can optionally include an <code>audioUrl</code>.
        </Typography>
        <Box
          component="pre"
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "action.hover",
            fontSize: 13,
            overflowX: "auto",
          }}
        >
          {SAMPLE_JSON}
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          sx={{ mt: 3 }}
        >
          <Button variant="contained" component="label" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Select JSON file"}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={onFileSelected}
            />
          </Button>
          {isUploading && <CircularProgress size={24} />}
        </Stack>
        <Typography variant="subtitle2" sx={{ mt: 3 }}>
          Or paste JSON directly
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            multiline
            minRows={6}
            value={pastedJson}
            onChange={(
              event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
              setPastedJson(event.target.value);
              setPasteError(null);
            }}
            placeholder={'{\n  "vocabulary": [...],\n  "sentences": [...]\n}'}
            fullWidth
            InputProps={{
              sx: {
                fontFamily: "monospace",
                fontSize: 13,
              },
            }}
            error={Boolean(pasteError)}
            helperText={pasteError || ""}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              onClick={handlePasteSubmit}
              disabled={isUploading}
            >
              Use pasted JSON
            </Button>
            {pasteError && (
              <Typography variant="body2" color="error">
                {pasteError}
              </Typography>
            )}
          </Stack>
        </Stack>
        {selectedFilename && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Selected file: {selectedFilename}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
            {counts && (
              <Box component="span" sx={{ display: "block" }}>
                {counts.vocabulary} vocabulary · {counts.sentences} sentences
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} disabled={isUploading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
