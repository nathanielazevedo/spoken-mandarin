"use client";

import React, { useState, useRef, useCallback } from "react";
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
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  Refresh as RetryIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
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

export interface PracticeRecordDialogProps {
  open: boolean;
  onClose: () => void;
  entry: PracticeEntry | null;
}

export const PracticeRecordDialog: React.FC<PracticeRecordDialogProps> = ({
  open,
  onClose,
  entry,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ASRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetState = useCallback(() => {
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
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      if (!entry) return;

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("targetPinyin", entry.pinyin);

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
      } catch (err) {
        console.error("ASR error:", err);
        setError((err as Error).message || "Failed to process audio");
      } finally {
        setIsProcessing(false);
      }
    },
    [entry]
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

      // Determine supported MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; // Let browser choose default
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
        // Stop all tracks
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

      // Start recording - collect data every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
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
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Request any remaining data before stopping
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording, recordingDuration]);

  const handleRetry = useCallback(() => {
    resetState();
  }, [resetState]);

  if (!entry) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">Practice Speaking</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Target sentence display */}
          <Box
            sx={{
              p: 3,
              backgroundColor: "action.hover",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
              {entry.pinyin}
            </Typography>
            {entry.hanzi && (
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                {entry.hanzi}
              </Typography>
            )}
            <Typography variant="body1" color="text.secondary">
              {entry.english}
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
                backgroundColor: result.passed
                  ? "success.lighter"
                  : "error.lighter",
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

                {result.mismatches.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Differences:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mt: 0.5 }}
                    >
                      {result.mismatches.map((mismatch, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={
                            mismatch.expected
                              ? `"${mismatch.received || "—"}" → "${
                                  mismatch.expected
                                }"`
                              : `Extra: "${mismatch.received}"`
                          }
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
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

            <Stack direction="row" spacing={2} justifyContent="center">
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
                <Button
                  variant="contained"
                  startIcon={<RetryIcon />}
                  onClick={handleRetry}
                  size="large"
                >
                  Try Again
                </Button>
              )}
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

          {isRecording && (
            <Typography
              variant="body2"
              color="error.main"
              textAlign="center"
              fontWeight={500}
            >
              Recording... Tap to stop
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
