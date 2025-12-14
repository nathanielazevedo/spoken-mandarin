"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import { ExamComponent, type Exam } from "../exam/ExamComponent";
import { ExamResult } from "../exam/ExamResult";

interface ExamSectionProps {
  lessonId: string;
  onExamPassed?: () => void;
}

interface ExamAttempt {
  score: number;
  passed: boolean;
  completedAt: Date;
}

export function ExamSection({ lessonId, onExamPassed }: ExamSectionProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [examResult, setExamResult] = useState<ExamAttempt | null>(null);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetchExam();
  }, [lessonId]);

  async function fetchExam() {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${lessonId}/exam`);

      if (response.status === 404) {
        // No exam for this lesson
        setExam(null);
      } else if (!response.ok) {
        throw new Error("Failed to fetch exam");
      } else {
        const data = await response.json();
        setExam(data.exam);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exam");
    } finally {
      setLoading(false);
    }
  }

  async function handleExamComplete(score: number, passed: boolean) {
    const timeSpent = examStartTime
      ? Math.round((Date.now() - examStartTime) / 1000)
      : undefined;

    // Record the exam attempt
    try {
      await fetch(`/api/progress/${lessonId}/exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, passed, timeSpent }),
      });

      if (passed && onExamPassed) {
        onExamPassed();
      }
    } catch (err) {
      console.error("Failed to record exam attempt:", err);
    }

    setExamResult({
      score,
      passed,
      completedAt: new Date(),
    });
    setShowExam(false);
    setExamStartTime(null);
  }

  function handleStartExam() {
    setExamStartTime(Date.now());
    setShowExam(true);
  }

  function handleTryAgain() {
    setExamResult(null);
    setExamStartTime(Date.now());
    setShowExam(true);
  }

  function handleContinue() {
    setExamResult(null);
  }

  // Don't render anything if loading or no exam
  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!exam || exam.questions.length === 0) {
    return null; // No exam for this lesson
  }

  // Show the exam
  if (showExam) {
    return (
      <Box sx={{ mt: 4 }}>
        <ExamComponent
          exam={exam}
          onComplete={handleExamComplete}
          onCancel={() => setShowExam(false)}
        />
      </Box>
    );
  }

  // Show exam results
  if (examResult) {
    return (
      <Box sx={{ mt: 4 }}>
        <ExamResult
          score={examResult.score}
          passed={examResult.passed}
          passingScore={exam.passingScore}
          onRetry={handleTryAgain}
          onContinue={handleContinue}
        />
      </Box>
    );
  }

  // Show exam card (invitation to take the exam)
  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, sm: 3 },
        mt: 4,
        borderRadius: 3,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {exam.title || "Lesson Exam"}
        </Typography>
        {exam.description && (
          <Typography variant="body2" color="text.secondary">
            {exam.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Chip
          icon={<QuizIcon />}
          label={`${exam.questions.length} questions`}
          size="small"
        />
        <Chip
          icon={<CheckCircleIcon />}
          label={`${exam.passingScore}% to pass`}
          size="small"
        />
        {exam.timeLimit && (
          <Chip
            icon={<TimerIcon />}
            label={`${exam.timeLimit} minutes`}
            size="small"
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test your knowledge of this lesson! Complete the exam to see how well
        you've learned the material.
      </Typography>

      <Button variant="contained" size="large" onClick={handleStartExam}>
        Start Exam
      </Button>
    </Paper>
  );
}
