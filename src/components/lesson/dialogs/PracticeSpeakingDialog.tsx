"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../../../types/lesson";

export interface ASRResult {
  transcript: string;
  transcriptPinyin: string;
  normalizedTranscript: string;
  targetPinyin: string;
  normalizedTarget: string;
  passed: boolean;
  similarity: number;
  mismatches: { index: number; expected: string; received: string }[];
}

export interface PracticeSpeakingDialogProps {
  open: boolean;
  onClose: () => void;
  entries: PracticeEntry[];
  title: string;
}

export const PracticeSpeakingDialog: React.FC<PracticeSpeakingDialogProps> = ({
  open,
  onClose,
  entries,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ASRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    new Set()
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentEntry = entries[currentIndex];
  const progress =
    entries.length > 0 ? ((currentIndex + 1) / entries.length) * 100 : 0;
  const completedCount = completedIndices.size;

  // Reset state when dialog opens/closes or entries change
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setCompletedIndices(new Set());
      resetRecordingState();
    }
  }, [open]);

  const resetRecordingState = useCallback(() => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setIsRecording(false);
    setRecordingDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    resetRecordingState();
    onClose();
  }, [onClose, resetRecordingState]);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      if (!currentEntry) return;

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("targetPinyin", currentEntry.pinyin);

        const response = await fetch("/api/asr", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to process audio");
        }

        const data: ASRResult = await response.json();
        setResult(data);

        // Mark as completed if passed
        if (data.passed) {
          setCompletedIndices((prev) => new Set([...prev, currentIndex]));
        }
      } catch (err) {
        console.error("ASR error:", err);
        setError((err as Error).message || "Failed to process audio");
      } finally {
        setIsProcessing(false);
      }
    },
    [currentEntry, currentIndex]
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";
          }
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          setError("No audio data recorded. Please try again.");
          setIsProcessing(false);
          return;
        }

        const actualMimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });

        if (audioBlob.size < 1000) {
          setError("Recording too short. Please speak for at least 1 second.");
          setIsProcessing(false);
          return;
        }

        await processAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 100);
      }, 100);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  }, [processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const handleNext = useCallback(() => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetRecordingState();
    }
  }, [currentIndex, entries.length, resetRecordingState]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetRecordingState();
    }
  }, [currentIndex, resetRecordingState]);

  const handleRetry = useCallback(() => {
    resetRecordingState();
  }, [resetRecordingState]);

  if (!currentEntry) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentIndex + 1} of {entries.length} • {completedCount} completed
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <LinearProgress variant="determinate" value={progress} sx={{ mx: 3 }} />

      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Target display */}
          <Box
            sx={{
              p: 3,
              backgroundColor: "action.hover",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
              {currentEntry.pinyin}
            </Typography>
            {currentEntry.hanzi && (
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                {currentEntry.hanzi}
              </Typography>
            )}
            <Typography variant="body1" color="text.secondary">
              {currentEntry.english}
            </Typography>
          </Box>

          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Result display */}
          {result && (
            <Box
              sx={{
                p: 2,
                border: "2px solid",
                borderColor: result.passed ? "success.main" : "error.main",
                borderRadius: 2,
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                >
                  {result.passed ? (
                    <PassIcon color="success" fontSize="large" />
                  ) : (
                    <FailIcon color="error" fontSize="large" />
                  )}
                  <Typography
                    variant="h6"
                    color={result.passed ? "success.main" : "error.main"}
                  >
                    {result.passed ? "Correct!" : "Try Again"}
                  </Typography>
                  <Chip
                    label={`${result.similarity}% match`}
                    size="small"
                    color={result.passed ? "success" : "error"}
                  />
                </Stack>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    We heard:
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {result.transcript || "(no speech detected)"}
                  </Typography>
                  {result.transcriptPinyin &&
                    result.transcriptPinyin !== result.transcript && (
                      <Typography variant="body1" color="text.secondary">
                        {result.transcriptPinyin}
                      </Typography>
                    )}
                </Box>
              </Stack>
            </Box>
          )}

          {/* Recording controls */}
          <Stack direction="column" spacing={1} alignItems="center">
            {isRecording && (
              <Typography variant="h6" color="error.main">
                {(recordingDuration / 1000).toFixed(1)}s
              </Typography>
            )}

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Previous button */}
              <IconButton
                onClick={handlePrev}
                disabled={currentIndex === 0 || isRecording || isProcessing}
                sx={{
                  width: 48,
                  height: 48,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <PrevIcon />
              </IconButton>

              {/* Record/Stop button */}
              {!result && !isProcessing && (
                <IconButton
                  onClick={isRecording ? stopRecording : startRecording}
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: isRecording
                      ? "error.main"
                      : "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: isRecording
                        ? "error.dark"
                        : "primary.dark",
                    },
                  }}
                >
                  {isRecording ? (
                    <StopIcon fontSize="large" />
                  ) : (
                    <MicIcon fontSize="large" />
                  )}
                </IconButton>
              )}

              {isProcessing && (
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={48} />
                </Box>
              )}

              {result && (
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={handleRetry} size="large">
                    Retry
                  </Button>
                  {currentIndex < entries.length - 1 && (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<NextIcon />}
                      size="large"
                    >
                      Next
                    </Button>
                  )}
                </Stack>
              )}

              {/* Next button */}
              <IconButton
                onClick={handleNext}
                disabled={
                  currentIndex === entries.length - 1 ||
                  isRecording ||
                  isProcessing
                }
                sx={{
                  width: 48,
                  height: 48,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <NextIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Instructions */}
          {!isRecording && !isProcessing && !result && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Tap the microphone and speak the phrase above
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
