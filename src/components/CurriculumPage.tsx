"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Skeleton,
  Alert,
  Paper,
  Button,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import { CheckCircle, Lock, Login, PlayArrow } from "@mui/icons-material";
import { TopNav } from "./TopNav";
import { useProgress } from "../hooks/useProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Types for the curriculum hierarchy
interface Lesson {
  id: string;
  order: number;
  name: string;
  description: string | null;
  _count: {
    vocabulary: number;
    sentences: number;
  };
}

interface Unit {
  id: string;
  order: number;
  name: string;
  description: string | null;
  lessons: Lesson[];
}

interface Level {
  id: string;
  order: number;
  name: string;
  description: string | null;
  units: Unit[];
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  levels: Level[];
}

interface CurriculumPageProps {
  onLessonClick?: (lessonId: string) => void;
}

// Convert number to Roman numeral
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let result = "";
  let remaining = num;

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

export const CurriculumPage: React.FC<CurriculumPageProps> = ({
  onLessonClick,
}) => {
  const [curriculum, setCurriculum] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    isLessonUnlocked,
    isLessonCompleted,
    loading: progressLoading,
  } = useProgress();

  // Find the current level (first level that's not completed or first level if none started)
  const getCurrentLevel = () => {
    if (!program) return null;

    for (const level of program.levels) {
      const allLessonsCompleted = level.units.every((unit) =>
        unit.lessons.every((lesson) => isLessonCompleted(lesson.id))
      );
      if (!allLessonsCompleted) {
        return level;
      }
    }
    // All levels completed, return last level
    return program.levels[program.levels.length - 1];
  };

  // Get current unit within a level
  const getCurrentUnit = (level: Level) => {
    for (const unit of level.units) {
      const allLessonsCompleted = unit.lessons.every((lesson) =>
        isLessonCompleted(lesson.id)
      );
      if (!allLessonsCompleted) {
        return unit;
      }
    }
    // All units completed, return last unit
    return level.units[level.units.length - 1];
  };

  // Find the next unlocked lesson
  const getNextLesson = () => {
    if (!program) return null;

    for (const level of program.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          if (isLessonUnlocked(lesson.id) && !isLessonCompleted(lesson.id)) {
            return lesson;
          }
        }
      }
    }
    return null;
  };

  const handleContinue = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push(`/lesson/${nextLesson.id}`);
    }
  };

  useEffect(() => {
    const fetchCurriculum = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/curriculum");
        if (!response.ok) {
          throw new Error("Failed to load curriculum");
        }
        const data = await response.json();
        setCurriculum(data);
      } catch (err) {
        setError((err as Error).message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurriculum();
  }, []);

  if (isLoading || authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.100",
        }}
      >
        <TopNav />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={80}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))}
        </Container>
      </Box>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.100",
        }}
      >
        <TopNav />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              textAlign: "center",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(30,30,30,0.95) 100%)"
                  : "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(255,255,255,0.95) 100%)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Lock
              sx={{
                fontSize: 64,
                color: "primary.main",
                mb: 2,
                opacity: 0.8,
              }}
            />
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Sign In to Access Curriculum
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
            >
              Create an account or sign in to start your Mandarin learning
              journey. Track your progress, unlock lessons, and master Chinese
              at your own pace.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Login />}
                onClick={() => router.push("/login")}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Sign In / Sign Up
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.100",
        }}
      >
        <TopNav />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  const program = curriculum[0];
  const currentLevel = program ? getCurrentLevel() : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "grey.100",
      }}
    >
      <TopNav />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Levels */}
        <Stack spacing={2}>
          {program?.levels.map((level) => {
            const isCurrentLevel = currentLevel?.id === level.id;
            const levelCompleted = level.units.every((unit) =>
              unit.lessons.every((lesson) => isLessonCompleted(lesson.id))
            );
            const levelLocked =
              !levelCompleted &&
              !isCurrentLevel &&
              program.levels.findIndex((l) => l.id === level.id) >
                program.levels.findIndex((l) => l.id === currentLevel?.id);

            const currentUnit = isCurrentLevel ? getCurrentUnit(level) : null;
            const completedLessons = currentUnit
              ? currentUnit.lessons.filter((l) => isLessonCompleted(l.id))
                  .length
              : 0;
            const totalLessons = currentUnit ? currentUnit.lessons.length : 0;

            return (
              <Card
                key={level.id}
                elevation={isCurrentLevel ? 3 : 0}
                sx={{
                  opacity: levelLocked ? 0.6 : 1,
                  transition: "all 0.3s ease",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: isCurrentLevel ? 2 : 0,
                    }}
                  >
                    {levelCompleted ? (
                      <CheckCircle color="success" sx={{ fontSize: 32 }} />
                    ) : levelLocked ? (
                      <Lock color="disabled" sx={{ fontSize: 32 }} />
                    ) : (
                      <PlayArrow color="primary" sx={{ fontSize: 32 }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Level {toRoman(level.order)} —{" "}
                        {levelCompleted
                          ? "Completed ✓"
                          : levelLocked
                          ? "Locked"
                          : "In Progress"}
                      </Typography>
                    </Box>
                  </Box>

                  <Collapse in={isCurrentLevel} timeout="auto">
                    <Box sx={{ mt: 2, pl: 5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {level.name}
                      </Typography>
                      {level.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {level.description}
                        </Typography>
                      )}
                      {currentUnit && (
                        <>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {currentUnit.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                          >
                            {completedLessons} / {totalLessons} lessons
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayArrow />}
                            onClick={handleContinue}
                            fullWidth
                            sx={{
                              py: 1.5,
                              fontWeight: 600,
                              fontSize: "1.1rem",
                            }}
                          >
                            Continue
                          </Button>
                        </>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};
