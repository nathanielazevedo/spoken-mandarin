import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  Button,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RestartIcon,
  TipsAndUpdates as HintIcon,
  CheckCircle as CorrectIcon,
  ErrorOutline as IncorrectIcon,
} from "@mui/icons-material";
import type { Vocabulary } from "../types/lesson";
import { normalizePinyin } from "../utils/pinyin";

interface VocabularyPracticeProps {
  vocabulary: Vocabulary[];
  onClose: () => void;
}

export const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({
  vocabulary,
  onClose,
}) => {
  const TIME_LIMIT_SECONDS = 15;
  const orderedVocabulary = useMemo(() => vocabulary.slice(), [vocabulary]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(orderedVocabulary.length === 0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [failureReason, setFailureReason] = useState<
    "time" | "input" | "reveal" | null
  >(null);

  const currentWord = orderedVocabulary[currentIndex];
  const progress = orderedVocabulary.length
    ? ((currentIndex + (completed ? 1 : 0)) / orderedVocabulary.length) * 100
    : 100;

  const resetForCurrentWord = useCallback(() => {
    setUserInput("");
    setResult(null);
    setRevealed(false);
    setTimeUp(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setIsLocked(false);
    setFailureReason(null);
  }, []);

  const handleSubmit = () => {
    if (!currentWord || !userInput.trim() || timeUp || isLocked) {
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

    setTimeout(() => {
      moveToNext();
    }, 600);
  };

  const moveToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < orderedVocabulary.length) {
      setCurrentIndex(nextIndex);
      resetForCurrentWord();
    } else {
      setCompleted(true);
      setUserInput("");
      setIsLocked(false);
      setTimeUp(false);
    }
  };

  const handleReveal = () => {
    if (!currentWord || timeUp || isLocked) {
      return;
    }
    handleFailure("reveal");
  };

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    resetForCurrentWord();
    setCompleted(orderedVocabulary.length === 0);
  }, [orderedVocabulary.length, resetForCurrentWord]);

  const handleFailure = useCallback((reason: "time" | "input" | "reveal") => {
    setResult("incorrect");
    setRevealed(true);
    setIsLocked(true);
    setTimeUp(reason === "time");
    setTimeLeft(0);
    setFailureReason(reason);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (completed || !currentWord || timeUp || isLocked) {
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
  }, [completed, currentWord, timeUp, isLocked, handleFailure]);

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
          maxWidth: 600,
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
          <Typography variant="h6">Vocabulary Practice</Typography>
          <Box>
            <IconButton onClick={handleRestart} size="small">
              <RestartIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 2, pt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

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
          {completed ? (
            <Box>
              <Typography variant="h5" color="success.main" gutterBottom>
                Great work!
              </Typography>
              <Typography color="text.secondary">
                You practiced all {orderedVocabulary.length} words.
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
                  label={`Time left: ${timeLeft}s`}
                  color={timeLeft <= 5 ? "error" : "default"}
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
                disabled={timeUp || isLocked}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || timeUp || isLocked}
                >
                  Check Answer
                </Button>
                <Button
                  variant="text"
                  onClick={handleReveal}
                  startIcon={<HintIcon />}
                  disabled={timeUp || isLocked}
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
                {result === "incorrect" && (
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
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">
              No vocabulary loaded.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};
