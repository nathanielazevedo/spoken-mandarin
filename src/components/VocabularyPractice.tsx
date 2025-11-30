import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  VolumeUpRounded as VolumeIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../types/lesson";
import { normalizePinyin } from "../utils/pinyin";

interface VocabularyPracticeProps {
  vocabulary: PracticeEntry[];
  onClose: () => void;
  itemLabel?: string;
  onEntryCompleted?: (entry: PracticeEntry, proceed: () => void) => void;
  sentenceMatches?: Record<string, PracticeEntry[]>;
}

const TIME_LIMIT_SECONDS = 15;
const RETRY_SUCCESS_TARGET = 5;

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
  sentenceMatches,
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
  const [retryMode, setRetryMode] = useState(false);
  const [retrySuccessCount, setRetrySuccessCount] = useState(0);
  const sentenceAudioRef = useRef<HTMLAudioElement | null>(null);

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
    setRetryMode(false);
    setRetrySuccessCount(0);
  }, [
    baseVocabulary,
    rangeEnd,
    rangeStart,
    resetForCurrentWord,
    totalVocabularyCount,
  ]);

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

    if (retryMode) {
      if (!isCorrect) {
        setRetrySuccessCount(0);
        setUserInput("");
        setTimeLeft(TIME_LIMIT_SECONDS);
        setTimeUp(false);
        return;
      }

      const nextCount = retrySuccessCount + 1;
      setRetrySuccessCount(nextCount);
      setUserInput("");
      setTimeLeft(TIME_LIMIT_SECONDS);
      setTimeUp(false);

      const playWordAudio = (after?: () => void) => {
        if (onEntryCompleted) {
          onEntryCompleted(currentWord, after ?? (() => {}));
        } else if (after) {
          after();
        }
      };

      if (nextCount >= RETRY_SUCCESS_TARGET) {
        const restart = () => {
          setRetryMode(false);
          setRevealed(false);
          setIsOverallRunning(false);
          startPractice();
        };
        playWordAudio(restart);
      } else {
        playWordAudio();
      }
      return;
    }

    if (!isCorrect) {
      handleFailure();
      return;
    }

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
    setRevealed(true);
    setIsLocked(false);
    setTimeUp(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setRetryMode(true);
    setRetrySuccessCount(0);
    setUserInput("");
    setIsOverallRunning(false);
  }, [completed, currentWord, hasSessionStarted]);

  const handleSkipRetry = useCallback(() => {
    if (!retryMode) {
      return;
    }
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
  const matchedSentences = useMemo(() => {
    if (!sentenceMatches || !currentWord) {
      return [] as PracticeEntry[];
    }
    return sentenceMatches[currentWord.id] ?? [];
  }, [currentWord, sentenceMatches]);
  const exampleSentence = matchedSentences[0];
  const retryRemaining = Math.max(0, RETRY_SUCCESS_TARGET - retrySuccessCount);

  const handlePlaySentenceAudio = useCallback((audioUrl?: string) => {
    if (!audioUrl) {
      return;
    }
    try {
      if (sentenceAudioRef.current) {
        sentenceAudioRef.current.pause();
        sentenceAudioRef.current = null;
      }
      const audio = new Audio(audioUrl);
      sentenceAudioRef.current = audio;
      audio.play().catch(() => {
        /* ignore play errors */
      });
    } catch {
      // Ignore audio errors
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sentenceAudioRef.current) {
        sentenceAudioRef.current.pause();
        sentenceAudioRef.current = null;
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0, 0, 0, 0.86)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: { xs: 1, sm: 2 },
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
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
              minHeight: 40,
              gap: 1,
              alignItems: "center",
            }}
          >
            {hasSessionStarted && retryMode ? (
              <Chip
                label={`Retry ${retrySuccessCount}/${RETRY_SUCCESS_TARGET}`}
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
                  </Stack>
                )}
                {hasSessionStarted && (
                  <Chip
                    label={formattedOverallTime}
                    variant={completed ? "filled" : "outlined"}
                    color={completed ? "success" : "default"}
                    size="small"
                  />
                )}
                {hasSessionStarted && (
                  <Chip
                    label={isPaused ? "Paused" : `${timeLeft}s`}
                    color={timerChipColor}
                    variant="outlined"
                    size="small"
                  />
                )}
              </>
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
            justifyContent: "center",
            gap: 2,
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
              >
                Start practice
              </Button>
            </Stack>
          )}

          {hasSessionStarted && completed && (
            <Stack spacing={2} textAlign="center">
              <Typography variant="h5" color="success.main">
                Perfect run complete
              </Typography>
              <Typography color="text.secondary">
                You cleared {practicedCount} {itemLabel}
                {sessionRange.start > 0 && sessionRange.end > 0
                  ? ` (range ${sessionRange.start}-${sessionRange.end})`
                  : ""}
                {practicedCount > 0 ? ` in ${formattedOverallTime}` : "."}
              </Typography>
            </Stack>
          )}

          {hasSessionStarted && !completed && currentWord && (
            <Stack spacing={2}>
              {isPaused && (
                <Chip
                  label="Practice paused"
                  color="warning"
                  variant="outlined"
                />
              )}
              <Typography variant="h4" textAlign="center">
                {currentWord.english}
              </Typography>
              <Box
                sx={{
                  minHeight: 48,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {revealed && (
                  <Typography variant="h4" textAlign="center" color="primary">
                    {currentWord.pinyin}
                  </Typography>
                )}
              </Box>
              <TextField
                fullWidth
                autoFocus
                label="Type the pinyin"
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={timeUp || isLocked || isPaused}
              />
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || timeUp || isLocked || isPaused}
                  fullWidth
                >
                  Check answer
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
                      Type it correctly {retryRemaining} more
                      {retryRemaining === 1 ? " time" : " times"} to restart the
                      drill from the beginning.
                    </Typography>
                    {exampleSentence && (
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Example sentence
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {exampleSentence.english}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {exampleSentence.pinyin}
                        </Typography>
                        {exampleSentence.hanzi && (
                          <Typography variant="body2" color="text.secondary">
                            {exampleSentence.hanzi}
                          </Typography>
                        )}
                        <Button
                          variant="outlined"
                          startIcon={<VolumeIcon />}
                          onClick={() =>
                            handlePlaySentenceAudio(exampleSentence.audioUrl)
                          }
                          disabled={!exampleSentence.audioUrl}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Play sentence audio
                        </Button>
                      </Stack>
                    )}
                    <Button
                      variant="text"
                      color="primary"
                      onClick={handleSkipRetry}
                      sx={{ alignSelf: "flex-end" }}
                    >
                      Skip extra practice
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
};
