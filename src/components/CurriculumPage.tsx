"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Skeleton,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  School,
  CheckCircle,
  Lock,
  Login,
  EmojiEvents,
} from "@mui/icons-material";
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
  isUnitFinal: boolean;
  isLevelFinal: boolean;
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

// Progress indicator component
interface ProgressIndicatorProps {
  program: Program;
  isLessonCompleted: (lessonId: string) => boolean;
  loading?: boolean;
}

function ProgressIndicator({
  program,
  isLessonCompleted,
  loading,
}: ProgressIndicatorProps) {
  // Calculate total lessons and completed lessons
  const totalLessons = program.levels.reduce(
    (acc, level) =>
      acc +
      level.units.reduce((unitAcc, unit) => unitAcc + unit.lessons.length, 0),
    0
  );

  const completedLessons = program.levels.reduce(
    (acc, level) =>
      acc +
      level.units.reduce(
        (unitAcc, unit) =>
          unitAcc +
          unit.lessons.filter((lesson) => isLessonCompleted(lesson.id)).length,
        0
      ),
    0
  );

  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Calculate level progress for more detailed view
  const levelProgress = program.levels.map((level) => {
    const levelTotalLessons = level.units.reduce(
      (acc, unit) => acc + unit.lessons.length,
      0
    );
    const levelCompletedLessons = level.units.reduce(
      (acc, unit) =>
        acc +
        unit.lessons.filter((lesson) => isLessonCompleted(lesson.id)).length,
      0
    );
    return {
      name: level.name,
      order: level.order,
      total: levelTotalLessons,
      completed: levelCompletedLessons,
      percentage:
        levelTotalLessons > 0
          ? Math.round((levelCompletedLessons / levelTotalLessons) * 100)
          : 0,
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        background: "background.paper",

        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Main progress section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
        {/* Circular progress */}
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant={loading ? "indeterminate" : "determinate"}
            value={progressPercentage}
            size={80}
            thickness={4}
            sx={{
              color: "primary.main",
              "& .MuiCircularProgress-circle": {
                strokeLinecap: "round",
              },
            }}
          />
          <CircularProgress
            variant="determinate"
            value={100}
            size={80}
            thickness={4}
            sx={{
              color: "divider",
              position: "absolute",
              left: 0,
              zIndex: -1,
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {progressPercentage === 100 ? (
              <EmojiEvents sx={{ fontSize: 32, color: "warning.main" }} />
            ) : (
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                {loading ? "..." : `${progressPercentage}%`}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Text info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {program.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {completedLessons} of {totalLessons} lessons completed
          </Typography>
          <LinearProgress
            variant={loading ? "indeterminate" : "determinate"}
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Box>

      {/* Level breakdown */}
      {program.levels.length > 1 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Progress by Level
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {levelProgress.map((level) => (
              <Tooltip
                key={level.order}
                title={`${level.completed}/${level.total} lessons completed`}
              >
                <Chip
                  label={`Level ${toRoman(level.order)}: ${level.percentage}%`}
                  size="small"
                  color={level.percentage === 100 ? "success" : "default"}
                  variant={level.percentage === 100 ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
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
    isLevelUnlocked,
    loading: progressLoading,
  } = useProgress();

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

  const handleLessonClick = (lessonId: string) => {
    // Check if lesson is unlocked before allowing navigation
    if (!isLessonUnlocked(lessonId)) {
      return; // Don't navigate to locked lessons
    }

    if (onLessonClick) {
      onLessonClick(lessonId);
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = `/lesson/${lessonId}`;
    }
  };

  if (isLoading || authLoading) {
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
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  const program = curriculum[0]; // We only have one program for now

  if (!program) {
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
          <Alert severity="info">No curriculum available yet.</Alert>
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
        {/* Program Progress Indicator */}
        <ProgressIndicator
          program={program}
          isLessonCompleted={isLessonCompleted}
          loading={progressLoading}
        />

        {/* Levels */}
        <Stack spacing={2}>
          {program.levels.map((level) => {
            const levelUnlocked = isLevelUnlocked(level.id);
            const levelCompleted = level.units.every((unit) =>
              unit.lessons.every((lesson) => isLessonCompleted(lesson.id))
            );
            const totalLessons = level.units.reduce(
              (acc, u) => acc + u.lessons.length,
              0
            );
            const completedLessonsInLevel = level.units.reduce(
              (acc, u) =>
                acc + u.lessons.filter((l) => isLessonCompleted(l.id)).length,
              0
            );

            return (
              <Card
                key={level.id}
                elevation={0}
                sx={{
                  border: "2px solid",
                  borderColor: levelCompleted ? "success.main" : "divider",
                  opacity: levelUnlocked ? 1 : 0.6,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: levelUnlocked ? "primary.main" : "divider",
                    boxShadow: levelUnlocked ? 3 : 0,
                  },
                }}
              >
                <CardActionArea
                  onClick={() =>
                    levelUnlocked &&
                    router.push(`/curriculum/level/${level.id}`)
                  }
                  disabled={!levelUnlocked}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        {levelCompleted ? (
                          <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        ) : levelUnlocked ? (
                          <School color="primary" sx={{ fontSize: 40 }} />
                        ) : (
                          <Lock color="disabled" sx={{ fontSize: 40 }} />
                        )}
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Level {toRoman(level.order)}: {level.name}
                          </Typography>
                          {level.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {level.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {level.units.length} units • {totalLessons} lessons
                      </Typography>
                      <Typography
                        variant="body2"
                        color={
                          levelCompleted ? "success.main" : "text.secondary"
                        }
                        sx={{ fontWeight: 600 }}
                      >
                        {completedLessonsInLevel}/{totalLessons} completed
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};
