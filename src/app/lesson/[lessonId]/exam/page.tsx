"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Button,
} from "@mui/material";
import { TopNav } from "@/components/TopNav";
import type { Exam } from "@/components/exam/ExamComponent";

interface ExamPageProps {
  params: Promise<{ lessonId: string }>;
}

export default function ExamPage({ params }: ExamPageProps) {
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then((p) => setLessonId(p.lessonId));
  }, [params]);

  useEffect(() => {
    if (!lessonId) return;

    async function fetchExam() {
      try {
        setLoading(true);
        const response = await fetch(`/api/lessons/${lessonId}/exam`);

        if (!response.ok) {
          throw new Error("Failed to fetch exam");
        }

        const data = await response.json();
        console.log("Exam data:", data);
        setExam(data.exam || data);
      } catch (err) {
        console.error("Exam fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [lessonId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!exam || !lessonId) return;

    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;

    exam.questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers[question.id]?.trim().toLowerCase() || "";
      const correctAnswer = question.correctAnswer.trim().toLowerCase();

      if (userAnswer === correctAnswer) {
        correctCount += question.points;
      }
    });

    const score = Math.round((correctCount / totalPoints) * 100);
    const passed = score >= exam.passingScore;

    // Record attempt
    try {
      await fetch(`/api/lessons/${lessonId}/exam/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, passed }),
      });
    } catch (err) {
      console.error("Failed to record exam attempt:", err);
    }

    // Navigate back to lesson with result
    router.push(`/lesson/${lessonId}?examScore=${score}&examPassed=${passed}`);
  };

  const allAnswered =
    exam?.questions?.every((q) => answers[q.id]?.trim()) || false;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !exam) {
    return (
      <Box sx={{ minHeight: "100vh" }}>
        <TopNav />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error || "Exam not found"}</Alert>
          <Button
            variant="outlined"
            onClick={() => router.push(`/lesson/${lessonId}`)}
            sx={{ mt: 2 }}
          >
            Back to Lesson
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "url('/hanziBackgroundDark.svg')"
            : "url('/haziBackground.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <TopNav />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: { xs: 3, sm: 4 }, mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {exam.title || "Lesson Exam"}
          </Typography>
          {exam.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {exam.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Passing score: {exam.passingScore}%
            </Typography>
            {exam.timeLimit && (
              <Typography variant="body2" color="text.secondary">
                • Time limit: {exam.timeLimit} minutes
              </Typography>
            )}
          </Stack>
        </Paper>

        <Stack spacing={3}>
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <Paper key={question.id} sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Question {index + 1} of {exam.questions.length}
                </Typography>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {question.prompt}
                </Typography>

                {question.type === "MULTIPLE_CHOICE" ? (
                  <Stack spacing={1}>
                    {question.options.map((option) => (
                      <Button
                        key={option}
                        variant={
                          answers[question.id] === option
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() => handleAnswerChange(question.id, option)}
                        fullWidth
                        sx={{ justifyContent: "flex-start", textAlign: "left" }}
                      >
                        {option}
                      </Button>
                    ))}
                  </Stack>
                ) : (
                  <input
                    type="text"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Type your answer..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No questions available for this exam
              </Typography>
            </Paper>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!allAnswered}
            fullWidth
            sx={{ py: 2, fontSize: "1.125rem", fontWeight: 600 }}
          >
            Submit Exam
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
