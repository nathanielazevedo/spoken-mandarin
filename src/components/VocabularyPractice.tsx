import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  Button,
  LinearProgress,
  Chip,
  Stack,
  Slider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RestartIcon,
  TipsAndUpdates as HintIcon,
  CheckCircle as CorrectIcon,
  ErrorOutline as IncorrectIcon,
  Timer as TimerIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
} from "@mui/icons-material";
import type { PracticeEntry } from "../types/lesson";
import { normalizePinyin } from "../utils/pinyin";

interface VocabularyPracticeProps {
  vocabulary: PracticeEntry[];
  onClose: () => void;
  title?: string;
  itemLabel?: string;
  onEntryCompleted?: (entry: PracticeEntry, proceed: () => void) => void;
}

type PracticeMode = "perfect" | "narrow";

export const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({
  vocabulary,
  onClose,
  title = "Vocabulary Practice",
  itemLabel = "words",
  onEntryCompleted,
}) => {
  const TIME_LIMIT_SECONDS = 15;
  const baseVocabulary = useMemo(() => vocabulary.slice(), [vocabulary]);
  const totalVocabularyCount = baseVocabulary.length;
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [activeVocabulary, setActiveVocabulary] = useState<PracticeEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [failureReason, setFailureReason] = useState<
    "time" | "input" | "reveal" | null
  >(null);
  const [overallSeconds, setOverallSeconds] = useState(0);
  const [isOverallRunning, setIsOverallRunning] = useState(false);
  const [narrowIncorrect, setNarrowIncorrect] = useState<PracticeEntry[]>([]);
  const narrowIncorrectIdsRef = useRef<Set<string>>(new Set());
  const [narrowRound, setNarrowRound] = useState(1);
  const [rangeStart, setRangeStart] = useState(() =>
    totalVocabularyCount > 0 ? 1 : 0
  );
  const [rangeEnd, setRangeEnd] = useState(() => totalVocabularyCount || 0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionRange, setSessionRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 0 });
  const [awaitingManualAdvance, setAwaitingManualAdvance] = useState(false);

  const currentWord = activeVocabulary[currentIndex];
  const progress = activeVocabulary.length
    ? ((currentIndex + (completed ? 1 : 0)) / activeVocabulary.length) * 100
    : 100;
  const progressLabel = activeVocabulary.length
    ? `${Math.min(currentIndex + 1, activeVocabulary.length)} / ${
        activeVocabulary.length
      }`
    : "0 / 0";
  const practicedCount = sessionTotal || baseVocabulary.length;

  const resetForCurrentWord = useCallback(() => {
    setUserInput("");
    setResult(null);
    setRevealed(false);
    setTimeUp(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setIsLocked(false);
    setFailureReason(null);
    setAwaitingManualAdvance(false);
  }, []);

  const resetNarrowIncorrect = useCallback(() => {
    narrowIncorrectIdsRef.current.clear();
    setNarrowIncorrect([]);
  }, []);

  const rememberNarrowIncorrect = useCallback((entry: PracticeEntry) => {
    setNarrowIncorrect((prev) => {
      if (narrowIncorrectIdsRef.current.has(entry.id)) {
        return prev;
      }
      narrowIncorrectIdsRef.current.add(entry.id);
      return [...prev, entry];
    });
  }, []);

  const startMode = useCallback(
    (selectedMode: PracticeMode) => {
      const startIdx = totalVocabularyCount
        ? Math.max(0, Math.min(rangeStart - 1, totalVocabularyCount - 1))
        : 0;
      const endIdx = totalVocabularyCount
        ? Math.max(startIdx, Math.min(rangeEnd - 1, totalVocabularyCount - 1))
        : 0;
      const initialList =
        totalVocabularyCount > 0 && rangeStart > 0 && rangeEnd > 0
          ? baseVocabulary.slice(startIdx, endIdx + 1)
          : [];
      setMode(selectedMode);
      setActiveVocabulary(initialList);
      setCurrentIndex(0);
      resetForCurrentWord();
      setCompleted(initialList.length === 0);
      setSessionTotal(initialList.length);
      setSessionRange(
        initialList.length
          ? { start: startIdx + 1, end: startIdx + initialList.length }
          : { start: 0, end: 0 }
      );
      setOverallSeconds(0);
      setIsOverallRunning(initialList.length > 0);
      setIsPaused(false);
      setResult(null);
      setTimeUp(false);
      setIsLocked(false);
      setFailureReason(null);
      resetNarrowIncorrect();
      setNarrowRound(1);
      setAwaitingManualAdvance(false);
    },
    [
      baseVocabulary,
      rangeEnd,
      rangeStart,
      resetForCurrentWord,
      resetNarrowIncorrect,
      totalVocabularyCount,
    ]
  );

  const moveToNext = useCallback(() => {
    if (!mode) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < activeVocabulary.length) {
      setCurrentIndex(nextIndex);
      resetForCurrentWord();
      return;
    }

    if (mode === "narrow" && narrowIncorrect.length > 0) {
      const nextRoundList = [...narrowIncorrect];
      setActiveVocabulary(nextRoundList);
      setCurrentIndex(0);
      resetForCurrentWord();
      setCompleted(false);
      setNarrowRound((prev) => prev + 1);
      resetNarrowIncorrect();
      return;
    }

    setCompleted(true);
    setUserInput("");
    setIsLocked(false);
    setTimeUp(false);
    setIsOverallRunning(false);
  }, [
    mode,
    currentIndex,
    activeVocabulary.length,
    narrowIncorrect,
    resetForCurrentWord,
    resetNarrowIncorrect,
  ]);

  const handleSubmit = () => {
    if (!currentWord || !userInput.trim() || timeUp || isLocked || isPaused) {
      return;
    }

    const isCorrect =
      normalizePinyin(userInput) === normalizePinyin(currentWord.pinyin);

    if (!isCorrect) {
      handleFailure("input");
      return;
    }

    setResult("correct");
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

  const handleReveal = () => {
    if (!currentWord || timeUp || isLocked || isPaused) {
      return;
    }
    handleFailure("reveal");
  };

  const handleRestart = useCallback(() => {
    if (mode) {
      startMode(mode);
    } else {
      setMode(null);
    }
    setIsPaused(false);
  }, [mode, startMode]);

  const handlePauseToggle = useCallback(() => {
    if (!mode || completed) {
      return;
    }
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        setIsOverallRunning(false);
      } else if (!timeUp && !isLocked) {
        setIsOverallRunning(true);
      }
      return next;
    });
  }, [mode, completed, timeUp, isLocked]);

  const handleFailure = useCallback(
    (reason: "time" | "input" | "reveal") => {
      if (!currentWord) {
        return;
      }
      setResult("incorrect");
      setRevealed(true);
      setIsLocked(true);
      setTimeUp(reason === "time");
      setTimeLeft(0);
      setFailureReason(reason);
      setAwaitingManualAdvance(true);

      if (mode === "narrow") {
        rememberNarrowIncorrect(currentWord);
      } else {
        setIsOverallRunning(false);
      }
    },
    [currentWord, mode, moveToNext, rememberNarrowIncorrect]
  );

  const handleContinueAfterFailure = useCallback(() => {
    if (!mode || !awaitingManualAdvance) {
      return;
    }

    setAwaitingManualAdvance(false);

    if (mode === "narrow") {
      setIsLocked(false);
      moveToNext();
      return;
    }
  }, [mode, awaitingManualAdvance, moveToNext]);

  const clampRangeValue = useCallback(
    (value: number) => {
      if (!totalVocabularyCount) {
        return 0;
      }
      if (Number.isNaN(value) || value < 1) {
        return 1;
      }
      if (value > totalVocabularyCount) {
        return totalVocabularyCount;
      }
      return value;
    },
    [totalVocabularyCount]
  );

  useEffect(() => {
    if (!totalVocabularyCount) {
      setRangeStart(0);
      setRangeEnd(0);
      return;
    }
    setRangeStart((prev) => clampRangeValue(prev || 1));
    setRangeEnd((prev) => clampRangeValue(prev || totalVocabularyCount));
  }, [clampRangeValue, totalVocabularyCount]);

  useEffect(() => {
    if (!totalVocabularyCount) {
      return;
    }
    if (rangeStart > rangeEnd) {
      setRangeEnd(rangeStart);
    }
  }, [rangeEnd, rangeStart, totalVocabularyCount]);

  const selectedCount = useMemo(() => {
    if (!totalVocabularyCount || rangeStart === 0 || rangeEnd === 0) {
      return 0;
    }
    return Math.max(0, rangeEnd - rangeStart + 1);
  }, [rangeEnd, rangeStart, totalVocabularyCount]);

  const handleRangeStartInputChange = useCallback(
    (value: number) => {
      if (!totalVocabularyCount) {
        setRangeStart(0);
        setRangeEnd(0);
        return;
      }
      const clamped = clampRangeValue(value);
      setRangeStart(clamped);
      if (clamped > rangeEnd) {
        setRangeEnd(clamped);
      }
    },
    [clampRangeValue, rangeEnd, totalVocabularyCount]
  );

  const handleRangeEndInputChange = useCallback(
    (value: number) => {
      if (!totalVocabularyCount) {
        setRangeStart(0);
        setRangeEnd(0);
        return;
      }
      const clamped = clampRangeValue(value);
      setRangeEnd(clamped);
      if (clamped < rangeStart) {
        setRangeStart(clamped);
      }
    },
    [clampRangeValue, rangeStart, totalVocabularyCount]
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
    if (!mode || completed || !currentWord || timeUp || isLocked || isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          handleFailure("time");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [mode, completed, currentWord, timeUp, isLocked, isPaused, handleFailure]);

  useEffect(() => {
    if (!mode || !isOverallRunning) {
      return;
    }
    const overallTimerId = window.setInterval(() => {
      setOverallSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(overallTimerId);
    };
  }, [mode, isOverallRunning]);

  const formattedOverallTime = useMemo(() => {
    const minutes = Math.floor(overallSeconds / 60);
    const seconds = overallSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [overallSeconds]);

  const modeLabel =
    mode === "perfect"
      ? "Perfect mode"
      : mode === "narrow"
      ? `Narrow Down — Round ${narrowRound}`
      : "Select mode";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {modeLabel}
            </Typography>
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {mode && (
              <>
                <Chip
                  label={`${
                    itemLabel === "words" ? "Word" : "Item"
                  } ${progressLabel}`}
                  variant="outlined"
                />
                <Chip
                  icon={<TimerIcon />}
                  label={`Overall: ${formattedOverallTime}`}
                  color={
                    completed
                      ? "success"
                      : result === "incorrect" && mode === "perfect"
                      ? "error"
                      : "default"
                  }
                  variant={isOverallRunning ? "filled" : "outlined"}
                />
                {sessionTotal > 0 && (
                  <Chip
                    label={`${sessionTotal} selected${
                      sessionRange.start > 0 && sessionRange.end > 0
                        ? ` (${sessionRange.start}-${sessionRange.end})`
                        : ""
                    }`}
                    variant="outlined"
                  />
                )}
                {mode === "narrow" && (
                  <Chip
                    label={`Round ${narrowRound}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </>
            )}
            {mode && !completed && (
              <IconButton onClick={handlePauseToggle} size="small">
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </IconButton>
            )}
            <IconButton onClick={handleRestart} size="small" disabled={!mode}>
              <RestartIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {mode && (
          <Box sx={{ px: 2, pt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        <Box
          sx={{
            p: 3,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            textAlign: "center",
          }}
        >
          {!mode ? (
            <Stack spacing={3} sx={{ width: "100%", maxWidth: 420 }}>
              <Typography variant="h5">Choose a practice mode</Typography>
              {totalVocabularyCount > 0 ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Select which {itemLabel} to include ({totalVocabularyCount}{" "}
                    total)
                  </Typography>
                  <Slider
                    value={[rangeStart || 1, rangeEnd || 1]}
                    onChange={handleRangeSliderChange}
                    valueLabelDisplay="auto"
                    min={1}
                    max={totalVocabularyCount}
                    step={1}
                    disabled={totalVocabularyCount <= 1}
                  />
                  <Stack direction="row" spacing={2}>
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
                  <Typography variant="body2" color="text.secondary">
                    Practicing {selectedCount} of {totalVocabularyCount}{" "}
                    {itemLabel}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Add {itemLabel} to start practicing.
                </Typography>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={() => startMode("perfect")}
                disabled={!selectedCount}
              >
                Perfect mode (current behavior)
              </Button>
              <Typography variant="body2" color="text.secondary">
                Perfect mode ends the session immediately when you make a
                mistake, encouraging flawless runs.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                onClick={() => startMode("narrow")}
                disabled={!selectedCount}
              >
                Narrow Down mode
              </Button>
              <Typography variant="body2" color="text.secondary">
                Narrow Down lets you continue even after mistakes, looping back
                through missed words until you finish a perfect round.
              </Typography>
            </Stack>
          ) : completed ? (
            <Box>
              <Typography variant="h5" color="success.main" gutterBottom>
                Great work!
              </Typography>
              <Typography color="text.secondary">
                You practiced {practicedCount} {itemLabel}
                {sessionRange.start > 0 && sessionRange.end > 0
                  ? ` (range ${sessionRange.start}-${sessionRange.end})`
                  : ""}
                {mode === "narrow" && narrowRound > 1
                  ? ` in ${narrowRound} rounds`
                  : ""}
                {practicedCount > 0 ? ` in ${formattedOverallTime}` : ""}.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={handleRestart}
                startIcon={<RestartIcon />}
              >
                Practice Again
              </Button>
            </Box>
          ) : currentWord ? (
            <>
              {isPaused && (
                <Chip
                  label="Practice paused"
                  color="warning"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              )}
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  English meaning
                </Typography>
                <Chip
                  label={isPaused ? "Paused" : `Time left: ${timeLeft}s`}
                  color={
                    isPaused ? "warning" : timeLeft <= 5 ? "error" : "default"
                  }
                  variant="outlined"
                />
              </Box>
              <Typography variant="h4" gutterBottom>
                {currentWord.english}
              </Typography>

              <Box
                sx={{ minHeight: 48, display: "flex", alignItems: "center" }}
              >
                {revealed && (
                  <Chip
                    icon={<HintIcon />}
                    label={`Target: ${currentWord.pinyin}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              <TextField
                fullWidth
                autoFocus
                label="Type the pinyin"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={timeUp || isLocked || isPaused}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || timeUp || isLocked || isPaused}
                >
                  Check Answer
                </Button>
                <Button
                  variant="text"
                  onClick={handleReveal}
                  startIcon={<HintIcon />}
                  disabled={timeUp || isLocked || isPaused}
                >
                  Reveal pinyin
                </Button>
              </Box>

              <Box
                sx={{
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {result === "correct" && (
                  <Chip
                    icon={<CorrectIcon />}
                    label="Correct!"
                    color="success"
                  />
                )}
                {result === "incorrect" && mode === "perfect" && (
                  <>
                    <Chip
                      icon={<IncorrectIcon />}
                      label={
                        failureReason === "time"
                          ? "Time's up"
                          : failureReason === "reveal"
                          ? "Reveal used"
                          : "Incorrect answer"
                      }
                      color="error"
                    />
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleRestart}
                      startIcon={<RestartIcon />}
                    >
                      Restart practice
                    </Button>
                  </>
                )}
                {result === "incorrect" && mode === "narrow" && (
                  <Chip
                    icon={<IncorrectIcon />}
                    label={
                      failureReason === "time"
                        ? "Added to retry list (time's up)"
                        : failureReason === "reveal"
                        ? "Added to retry list (revealed)"
                        : "Added to retry list"
                    }
                    color="warning"
                  />
                )}
                {result === "incorrect" && awaitingManualAdvance && (
                  <Button
                    variant="contained"
                    onClick={handleContinueAfterFailure}
                    disabled={!mode}
                  >
                    Continue
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">
              No {itemLabel} loaded.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};
