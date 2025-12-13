import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../types/lesson";

export interface ListenDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entries: PracticeEntry[];
  currentEntryId: string | null;
  isPlaying: boolean;
  pauseMs: number;
  pauseMinMs?: number;
  pauseMaxMs?: number;
  pauseStepMs?: number;
  onPauseChange: (ms: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export const ListenDialog: React.FC<ListenDialogProps> = ({
  open,
  onClose,
  title,
  entries,
  currentEntryId,
  isPlaying,
  pauseMs,
  pauseMinMs = 0,
  pauseMaxMs = 3000,
  pauseStepMs = 100,
  onPauseChange,
  onPlay,
  onStop,
}) => {
  const currentEntry = entries.find((e) => e.id === currentEntryId);
  const currentIndex = currentEntryId
    ? entries.findIndex((e) => e.id === currentEntryId)
    : -1;

  const handleClose = () => {
    onStop();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Current word display */}
          <Box
            sx={{
              minHeight: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "action.hover",
              borderRadius: 2,
              p: 3,
            }}
          >
            {currentEntry ? (
              <>
                <Typography variant="h4" fontWeight={600} textAlign="center">
                  {currentEntry.pinyin}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 1 }}
                >
                  {currentEntry.english}
                </Typography>
                <Chip
                  label={`${currentIndex + 1} / ${entries.length}`}
                  size="small"
                  sx={{ mt: 2 }}
                />
              </>
            ) : (
              <Typography variant="body1" color="text.secondary">
                {isPlaying ? "Loading..." : "Press play to start"}
              </Typography>
            )}
          </Box>

          {/* Speed control */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pause between words: {(pauseMs / 1000).toFixed(1)}s
            </Typography>
            <Slider
              value={pauseMs}
              min={pauseMinMs}
              max={pauseMaxMs}
              step={pauseStepMs}
              onChange={(_, value) => {
                if (typeof value === "number") {
                  onPauseChange(value);
                }
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value / 1000).toFixed(1)}s`}
            />
          </Box>

          {/* Playback controls */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <IconButton
              onClick={onPlay}
              disabled={!entries.length}
              sx={{
                width: 64,
                height: 64,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                "&:disabled": {
                  backgroundColor: "action.disabledBackground",
                },
              }}
            >
              {isPlaying ? (
                <PauseIcon fontSize="large" />
              ) : (
                <PlayIcon fontSize="large" />
              )}
            </IconButton>
            <IconButton
              onClick={onStop}
              disabled={!isPlaying && !currentEntryId}
              sx={{
                width: 64,
                height: 64,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <StopIcon fontSize="large" />
            </IconButton>
          </Stack>

          {/* Progress indicator */}
          {entries.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 0.5,
              }}
            >
              {entries.map((entry, index) => (
                <Box
                  key={entry.id}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      entry.id === currentEntryId
                        ? "primary.main"
                        : index < currentIndex
                        ? "primary.light"
                        : "action.disabled",
                    transition: "background-color 0.2s",
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
