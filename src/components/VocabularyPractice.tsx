import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  RestartAlt as RestartIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../types/lesson";
import { normalizePinyin } from "../utils/pinyin";

interface VocabularyPracticeProps {
  vocabulary: PracticeEntry[];
  onClose: () => void;
  itemLabel?: string;
  onEntryCompleted?: (entry: PracticeEntry, proceed: () => void) => void;
}

const TIME_LIMIT_SECONDS = 15;

const clampIndexValue = (value: number, max: number): number => {
  if (!max) {
    return 0;
  }
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({
  vocabulary,
  onClose,
  itemLabel = "words",
  onEntryCompleted,
}) => {
  const baseVocabulary = useMemo(() => vocabulary.slice(), [vocabulary]);
  const totalVocabularyCount = baseVocabulary.length;

  const [rangeStart, setRangeStart] = useState(
    totalVocabularyCount > 0 ? 1 : 0
  );
  const [rangeEnd, setRangeEnd] = useState(totalVocabularyCount || 0);

  const [activeVocabulary, setActiveVocabulary] = useState<PracticeEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionRange, setSessionRange] = useState({ start: 0, end: 0 });
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [userInput, setUserInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overallSeconds, setOverallSeconds] = useState(0);
  const [isOverallRunning, setIsOverallRunning] = useState(false);
  const [missedWords, setMissedWords] = useState<PracticeEntry[]>([]);
  const [reviewRound, setReviewRound] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [retrySuccessCount, setRetrySuccessCount] = useState(0);

  const RETRY_TARGET = 5;

  const currentWord = activeVocabulary[currentIndex] ?? null;
  const progress = sessionTotal
    ? ((currentIndex + (completed ? 1 : 0)) / sessionTotal) * 100
    : 0;
  const progressLabel = sessionTotal
    ? `${Math.min(currentIndex + 1, sessionTotal)} / ${sessionTotal}`
    : "0 / 0";
  const progressPercentLabel = sessionTotal
    ? `${progress.toFixed(1)}%`
    : "0.0%";
  const selectedCount = useMemo(() => {
    if (!totalVocabularyCount || rangeStart === 0 || rangeEnd === 0) {
      return 0;
    }
    const start = Math.min(rangeStart, rangeEnd);
    const end = Math.max(rangeStart, rangeEnd);
    return Math.max(0, end - start + 1);
  }, [rangeEnd, rangeStart, totalVocabularyCount]);
  const practicedCount = sessionTotal;

  const formattedOverallTime = useMemo(() => {
    const minutes = Math.floor(overallSeconds / 60);
    const seconds = overallSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [overallSeconds]);

  const resetForCurrentWord = useCallback(() => {
    setUserInput("");
    setRevealed(false);
    setTimeUp(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setIsLocked(false);
    setRetryMode(false);
    setRetrySuccessCount(0);
  }, []);

  const startPractice = useCallback(() => {
    if (!totalVocabularyCount) {
      return;
    }

    const startIdx = clampIndexValue(rangeStart, totalVocabularyCount) - 1;
    const endIdx = clampIndexValue(rangeEnd, totalVocabularyCount) - 1;
    const selectionStart = Math.min(startIdx, endIdx);
    const selectionEnd = Math.max(startIdx, endIdx);
    const selected = baseVocabulary.slice(selectionStart, selectionEnd + 1);

    if (!selected.length) {
      setActiveVocabulary([]);
      setSessionTotal(0);
      setSessionRange({ start: 0, end: 0 });
      return;
    }

    setActiveVocabulary(selected);
    setSessionTotal(selected.length);
    setSessionRange({
      start: selectionStart + 1,
      end: selectionStart + selected.length,
    });
    setCurrentIndex(0);
    setHasSessionStarted(true);
    setCompleted(false);
    resetForCurrentWord();
    setIsOverallRunning(true);
    setIsPaused(false);
    setMissedWords([]);
    setReviewRound(0);
  }, [
    baseVocabulary,
    rangeEnd,
    rangeStart,
    resetForCurrentWord,
    totalVocabularyCount,
  ]);

  const startMissedWordsReview = useCallback(() => {
    if (missedWords.length === 0) return;

    setActiveVocabulary([...missedWords]);
    setSessionTotal(missedWords.length);
    setCurrentIndex(0);
    setCompleted(false);
    resetForCurrentWord();
    setIsOverallRunning(true);
    setIsPaused(false);
    setMissedWords([]);
    setReviewRound((prev) => prev + 1);
  }, [missedWords, resetForCurrentWord]);

  const moveToNext = useCallback(() => {
    if (!hasSessionStarted || completed) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < activeVocabulary.length) {
      setCurrentIndex(nextIndex);
      resetForCurrentWord();
      return;
    }

    setCompleted(true);
    setIsOverallRunning(false);
    setUserInput("");
  }, [
    activeVocabulary.length,
    completed,
    currentIndex,
    hasSessionStarted,
    resetForCurrentWord,
  ]);

  const handleSubmit = () => {
    if (
      !currentWord ||
      !userInput.trim() ||
      timeUp ||
      isLocked ||
      isPaused ||
      completed
    ) {
      return;
    }

    const isCorrect =
      normalizePinyin(userInput) === normalizePinyin(currentWord.pinyin);

    // Handle retry mode
    if (retryMode) {
      if (!isCorrect) {
        // Wrong during retry - reset counter and try again
        setRetrySuccessCount(0);
        setUserInput("");
        setTimeLeft(TIME_LIMIT_SECONDS);
        return;
      }

      // Correct during retry
      const nextCount = retrySuccessCount + 1;
      setRetrySuccessCount(nextCount);
      setUserInput("");
      setTimeLeft(TIME_LIMIT_SECONDS);

      // Play audio if available
      if (onEntryCompleted) {
        onEntryCompleted(currentWord, () => {});
      }

      // After 5 correct retries, move to next word
      if (nextCount >= RETRY_TARGET) {
        setRetryMode(false);
        setRetrySuccessCount(0);
        setRevealed(false);
        setIsOverallRunning(true);
        moveToNext();
      }
      return;
    }

    // Normal mode - wrong answer
    if (!isCorrect) {
      handleFailure();
      return;
    }

    // Normal mode - correct answer
    setRevealed(true);

    const proceed = () => {
      setTimeout(() => {
        moveToNext();
      }, 600);
    };

    if (onEntryCompleted) {
      onEntryCompleted(currentWord, proceed);
    } else {
      proceed();
    }
  };

  const handleRestart = useCallback(() => {
    startPractice();
  }, [startPractice]);

  const handlePauseToggle = useCallback(() => {
    if (!hasSessionStarted || completed) {
      return;
    }
    setIsPaused((prev) => {
      const next = !prev;
      setIsOverallRunning(!next);
      return next;
    });
  }, [completed, hasSessionStarted]);

  const handleFailure = useCallback(() => {
    if (!hasSessionStarted || completed || !currentWord) {
      return;
    }
    // Track this word as missed (avoid duplicates)
    setMissedWords((prev) => {
      if (prev.some((w) => w.id === currentWord.id)) {
        return prev;
      }
      return [...prev, currentWord];
    });
    // Enter retry mode - user must type it correctly 5 times
    setRevealed(true);
    setRetryMode(true);
    setRetrySuccessCount(0);
    setUserInput("");
    setTimeLeft(TIME_LIMIT_SECONDS);
    setTimeUp(false);
    setIsOverallRunning(false);
  }, [completed, currentWord, hasSessionStarted]);

  const handleSkipRetry = useCallback(() => {
    if (!retryMode) return;
    setRetryMode(false);
    setRetrySuccessCount(0);
    setRevealed(false);
    setIsOverallRunning(true);
    moveToNext();
  }, [moveToNext, retryMode]);

  const handleRangeStartInputChange = useCallback(
    (value: number) => {
      if (!totalVocabularyCount) {
        setRangeStart(0);
        setRangeEnd(0);
        return;
      }
      const clamped = clampIndexValue(value, totalVocabularyCount);
      setRangeStart(clamped);
      if (clamped > rangeEnd) {
        setRangeEnd(clamped);
      }
    },
    [rangeEnd, totalVocabularyCount]
  );

  const handleRangeEndInputChange = useCallback(
    (value: number) => {
      if (!totalVocabularyCount) {
        setRangeStart(0);
        setRangeEnd(0);
        return;
      }
      const clamped = clampIndexValue(value, totalVocabularyCount);
      setRangeEnd(clamped);
      if (clamped < rangeStart) {
        setRangeStart(clamped);
      }
    },
    [rangeStart, totalVocabularyCount]
  );

  const handleRangeSliderChange = useCallback(
    (_: unknown, value: number | number[]) => {
      if (!Array.isArray(value)) {
        return;
      }
      const [startValue, endValue] = value;
      setRangeStart(startValue);
      setRangeEnd(endValue);
    },
    []
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (
      !hasSessionStarted ||
      completed ||
      !currentWord ||
      timeUp ||
      isLocked ||
      isPaused
    ) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          handleFailure();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    completed,
    currentWord,
    handleFailure,
    hasSessionStarted,
    isLocked,
    isPaused,
    timeUp,
  ]);

  useEffect(() => {
    if (!hasSessionStarted || !isOverallRunning || completed) {
      return;
    }
    const timerId = window.setInterval(() => {
      setOverallSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [completed, hasSessionStarted, isOverallRunning]);

  const sliderValue: [number, number] = totalVocabularyCount
    ? [rangeStart || 1, rangeEnd || totalVocabularyCount]
    : [0, 0];

  const disableControls = !hasSessionStarted;
  const timerChipColor =
    timeLeft <= 5 && !isPaused ? "error" : isPaused ? "warning" : "default";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        zIndex: 1300,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: { xs: 1.5, sm: 2 },
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Back to lesson">
              <IconButton onClick={onClose} aria-label="Back to lesson">
                <CloseIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPaused ? "Resume" : "Pause"}>
              <span>
                <IconButton
                  onClick={handlePauseToggle}
                  disabled={disableControls || completed}
                  aria-label={isPaused ? "Resume practice" : "Pause practice"}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Restart practice">
              <span>
                <IconButton
                  onClick={handleRestart}
                  disabled={disableControls}
                  aria-label="Restart practice"
                >
                  <RestartIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
            sx={{
              flex: 1,
              minHeight: { xs: 32, sm: 40 },
              gap: { xs: 0.5, sm: 1 },
              alignItems: "center",
            }}
          >
            {hasSessionStarted && retryMode ? (
              <Chip
                label={`Retry ${retrySuccessCount}/${RETRY_TARGET}`}
                color="warning"
                variant="outlined"
                size="small"
              />
            ) : (
              <>
                {hasSessionStarted && !!sessionTotal && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`${progressLabel} (${progressPercentLabel})`}
                      variant="outlined"
                      size="small"
                    />
                    {missedWords.length > 0 && !completed && (
                      <Chip
                        label={`${missedWords.length} missed`}
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                )}
              </>
            )}
            {hasSessionStarted && (
              <Chip
                label={formattedOverallTime}
                variant={completed ? "filled" : "outlined"}
                color={completed ? "success" : "default"}
                size="small"
              />
            )}
            {hasSessionStarted && !completed && !retryMode && (
              <Chip
                label={isPaused ? "Paused" : `${timeLeft}s`}
                color={timerChipColor}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={hasSessionStarted && sessionTotal > 0 ? progress : 0}
          sx={{
            width: "100%",
            height: 3,
            borderRadius: 0,
            flexShrink: 0,
          }}
        />

        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent:
              hasSessionStarted && !completed ? "flex-start" : "center",
            gap: 2,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {!hasSessionStarted && (
            <Stack
              spacing={2}
              sx={{ width: "100%", maxWidth: 460, mx: "auto" }}
            >
              {totalVocabularyCount > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Select the range of {itemLabel} to drill.
                  </Typography>
                  <Slider
                    value={sliderValue}
                    onChange={handleRangeSliderChange}
                    valueLabelDisplay="auto"
                    min={1}
                    max={totalVocabularyCount}
                    step={1}
                    disabled={totalVocabularyCount <= 1}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      type="number"
                      label="Start index"
                      value={rangeStart || ""}
                      onChange={(event) =>
                        handleRangeStartInputChange(Number(event.target.value))
                      }
                      inputProps={{ min: 1, max: totalVocabularyCount }}
                      fullWidth
                    />
                    <TextField
                      type="number"
                      label="End index"
                      value={rangeEnd || ""}
                      onChange={(event) =>
                        handleRangeEndInputChange(Number(event.target.value))
                      }
                      inputProps={{ min: 1, max: totalVocabularyCount }}
                      fullWidth
                    />
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Add {itemLabel} to begin practicing.
                </Typography>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={startPractice}
                disabled={!selectedCount}
                sx={{
                  py: { xs: 1.5, sm: 1 },
                  fontSize: { xs: "1rem", sm: "0.875rem" },
                  minHeight: { xs: 48, sm: 42 },
                }}
              >
                Start practice
              </Button>
            </Stack>
          )}

          {hasSessionStarted && completed && (
            <Stack spacing={2} textAlign="center">
              {missedWords.length === 0 ? (
                <>
                  <Typography variant="h5" color="success.main">
                    {reviewRound > 0
                      ? "All words mastered!"
                      : "Perfect run complete"}
                  </Typography>
                  <Typography color="text.secondary">
                    You cleared {practicedCount} {itemLabel}
                    {sessionRange.start > 0 &&
                    sessionRange.end > 0 &&
                    reviewRound === 0
                      ? ` (range ${sessionRange.start}-${sessionRange.end})`
                      : ""}
                    {practicedCount > 0 ? ` in ${formattedOverallTime}` : "."}
                    {reviewRound > 0 &&
                      ` after ${reviewRound} review round${
                        reviewRound > 1 ? "s" : ""
                      }.`}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h5" color="warning.main">
                    Round complete
                  </Typography>
                  <Typography color="text.secondary">
                    You missed {missedWords.length}{" "}
                    {itemLabel === "words"
                      ? missedWords.length === 1
                        ? "word"
                        : "words"
                      : itemLabel}
                    .{reviewRound > 0 && ` (Review round ${reviewRound})`}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={startMissedWordsReview}
                    color="warning"
                  >
                    Review missed {itemLabel} ({missedWords.length})
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={startPractice}
                  >
                    Start over
                  </Button>
                </>
              )}
            </Stack>
          )}

          {hasSessionStarted && !completed && currentWord && (
            <Stack
              spacing={3}
              sx={{ width: "100%", maxWidth: 600, mx: "auto" }}
            >
              {isPaused && (
                <Chip
                  label="Practice paused"
                  color="warning"
                  variant="outlined"
                />
              )}
              <Typography
                variant="h4"
                textAlign="center"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.125rem" },
                  fontWeight: 600,
                  mt: { xs: 2, sm: 0 },
                }}
              >
                {currentWord.english}
              </Typography>
              <Box
                sx={{
                  minHeight: { xs: 60, sm: 80 },
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {revealed && (
                  <Typography
                    variant="h3"
                    textAlign="center"
                    color="primary"
                    sx={{
                      fontSize: { xs: "2.5rem", sm: "3rem" },
                      fontWeight: 700,
                    }}
                  >
                    {currentWord.pinyin}
                  </Typography>
                )}
              </Box>
              <TextField
                fullWidth
                autoFocus
                label={retryMode ? "Type it again" : "Type the pinyin"}
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={timeUp || isLocked || isPaused}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="text"
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: { xs: "1.25rem", sm: "1.125rem" },
                  },
                  "& .MuiInputBase-input": {
                    textAlign: "center",
                    py: { xs: 2, sm: 1.5 },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "1.125rem", sm: "1rem" },
                  },
                }}
              />
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || timeUp || isLocked || isPaused}
                  fullWidth
                  size="large"
                  sx={{
                    py: 2,
                    fontSize: { xs: "1.125rem", sm: "1rem" },
                    minHeight: 56,
                    fontWeight: 600,
                  }}
                >
                  {retryMode ? "Submit" : "Check answer"}
                </Button>
                {retryMode && (
                  <Stack
                    spacing={1}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="warning.main"
                      textAlign="center"
                    >
                      Type it correctly {RETRY_TARGET - retrySuccessCount} more
                      {RETRY_TARGET - retrySuccessCount === 1
                        ? " time"
                        : " times"}{" "}
                      to continue.
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      onClick={handleSkipRetry}
                      sx={{ alignSelf: "flex-end" }}
                    >
                      Skip
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};
