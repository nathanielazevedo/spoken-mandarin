"use client";

import { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import {
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";

export type QuestionType =
  | "LISTENING"
  | "TRANSLATE_TO_ENGLISH"
  | "TRANSLATE_TO_CHINESE"
  | "FILL_BLANK"
  | "MULTIPLE_CHOICE"
  | "SPEAKING";

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  promptAudioUrl?: string | null;
  correctAnswer: string;
  options: string[];
  explanation?: string | null;
  points: number;
}

export interface Exam {
  id: string;
  title?: string | null;
  description?: string | null;
  passingScore: number;
  timeLimit?: number | null;
  questions: ExamQuestion[];
}

interface ExamComponentProps {
  exam: Exam;
  onComplete: (score: number, passed: boolean) => void;
  onCancel?: () => void;
}

interface AnswerResult {
  questionId: string;
  userAnswer: string;
  correct: boolean;
  points: number;
}

export function ExamComponent({
  exam,
  onComplete,
  onCancel,
}: ExamComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = exam.questions[currentIndex];
  const progress = ((currentIndex + 1) / exam.questions.length) * 100;
  const isLastQuestion = currentIndex === exam.questions.length - 1;

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const checkAnswer = (): boolean => {
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentQuestion.correctAnswer
      .trim()
      .toLowerCase();

    // For multiple choice, exact match
    if (currentQuestion.type === "MULTIPLE_CHOICE") {
      return normalizedUser === normalizedCorrect;
    }

    // For other types, be more lenient (allow minor differences)
    return normalizedUser === normalizedCorrect;
  };

  const handleSubmitAnswer = () => {
    const correct = checkAnswer();
    const result: AnswerResult = {
      questionId: currentQuestion.id,
      userAnswer,
      correct,
      points: correct ? currentQuestion.points : 0,
    };

    setAnswers([...answers, result]);
    setIsSubmitted(true);
    setShowResult(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final score
      const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
      const earnedPoints =
        answers.reduce((sum, a) => sum + a.points, 0) +
        (checkAnswer() ? currentQuestion.points : 0);
      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= exam.passingScore;
      onComplete(score, passed);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setIsSubmitted(false);
      setShowResult(false);
    }
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case "LISTENING":
        return (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Listen and type what you hear:
            </Typography>
            {currentQuestion.promptAudioUrl && (
              <IconButton
                onClick={() => playAudio(currentQuestion.promptAudioUrl!)}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                  mb: 3,
                }}
              >
                <VolumeUpIcon sx={{ fontSize: 40 }} />
              </IconButton>
            )}
            <TextField
              fullWidth
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type what you hear..."
              disabled={isSubmitted}
              autoFocus
            />
          </Box>
        );

      case "TRANSLATE_TO_ENGLISH":
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Translate to English:
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              {currentQuestion.prompt}
            </Typography>
            {currentQuestion.promptAudioUrl && (
              <IconButton
                onClick={() => playAudio(currentQuestion.promptAudioUrl!)}
                size="small"
                sx={{ mb: 2 }}
              >
                <VolumeUpIcon />
              </IconButton>
            )}
            <TextField
              fullWidth
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type the English translation..."
              disabled={isSubmitted}
              autoFocus
            />
          </Box>
        );

      case "TRANSLATE_TO_CHINESE":
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Translate to Chinese (pinyin):
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              {currentQuestion.prompt}
            </Typography>
            <TextField
              fullWidth
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type the pinyin..."
              disabled={isSubmitted}
              autoFocus
            />
          </Box>
        );

      case "FILL_BLANK":
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Fill in the blank:
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              {currentQuestion.prompt.replace("___", "_______")}
            </Typography>
            <TextField
              fullWidth
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type the missing word..."
              disabled={isSubmitted}
              autoFocus
            />
          </Box>
        );

      case "MULTIPLE_CHOICE":
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {currentQuestion.prompt}
            </Typography>
            <RadioGroup
              value={userAnswer}
              onChange={(e) => !isSubmitted && setUserAnswer(e.target.value)}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio disabled={isSubmitted} />}
                  label={option}
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isSubmitted
                      ? option === currentQuestion.correctAnswer
                        ? "success.light"
                        : option === userAnswer
                        ? "error.light"
                        : "transparent"
                      : "transparent",
                  }}
                />
              ))}
            </RadioGroup>
          </Box>
        );

      case "SPEAKING":
        return (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Say the following phrase:
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              {currentQuestion.prompt}
            </Typography>
            {currentQuestion.promptAudioUrl && (
              <Box sx={{ mb: 3 }}>
                <IconButton
                  onClick={() => playAudio(currentQuestion.promptAudioUrl!)}
                  size="small"
                >
                  <VolumeUpIcon />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  Listen first
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<MicIcon />}
              disabled={isSubmitted}
              onClick={() => {
                // For now, just mark as attempted
                // Real implementation would use Web Speech API
                setUserAnswer("attempted");
              }}
            >
              Record Answer
            </Button>
            {userAnswer === "attempted" && !isSubmitted && (
              <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
                Recording complete! Click Submit to check.
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
      <audio ref={audioRef} />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentIndex + 1} of {exam.questions.length}
          </Typography>
          <Chip
            label={currentQuestion.type.replace(/_/g, " ")}
            size="small"
            variant="outlined"
          />
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {/* Question Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderQuestionContent()}

          {/* Result feedback */}
          {showResult && (
            <Alert
              severity={checkAnswer() ? "success" : "error"}
              icon={checkAnswer() ? <CheckIcon /> : <CloseIcon />}
              sx={{ mt: 2 }}
            >
              {checkAnswer() ? (
                "Correct!"
              ) : (
                <>
                  Incorrect. The correct answer is:{" "}
                  <strong>{currentQuestion.correctAnswer}</strong>
                </>
              )}
              {currentQuestion.explanation && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {currentQuestion.explanation}
                </Typography>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel}>
            Exit Exam
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {!isSubmitted ? (
          <Button
            variant="contained"
            onClick={handleSubmitAnswer}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}
          >
            {isLastQuestion ? "Finish Exam" : "Next Question"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
