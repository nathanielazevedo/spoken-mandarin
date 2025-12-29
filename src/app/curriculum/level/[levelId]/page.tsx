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
  Alert,
  IconButton,
  Skeleton,
} from "@mui/material";
import { MenuBook, CheckCircle, Lock, ArrowBack } from "@mui/icons-material";
import { TopNav } from "@/components/TopNav";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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

export default function LevelPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const [levelId, setLevelId] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const {
    isLessonUnlocked,
    isLessonCompleted,
    isUnitUnlocked,
    loading: progressLoading,
  } = useProgress();

  // Unwrap params Promise
  useEffect(() => {
    params.then((p) => setLevelId(p.levelId));
  }, [params]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!levelId) return;

    const fetchLevel = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/curriculum");
        if (!response.ok) throw new Error("Failed to fetch curriculum");

        const data = await response.json();
        const program = data[0];
        const foundLevel = program?.levels.find((l: Level) => l.id === levelId);

        if (!foundLevel) {
          setError("Level not found");
          return;
        }

        setLevel(foundLevel);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevel();
  }, [levelId, user, router]);

  const handleLessonClick = (lessonId: string) => {
    if (isLessonUnlocked(lessonId)) {
      router.push(`/lesson/${lessonId}`);
    }
  };

  if (isLoading || progressLoading) {
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
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !level) {
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
          <Alert severity="error">{error || "Level not found"}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "grey.100",
      }}
    >
      <TopNav
        breadcrumb={{
          program: "Mandarin Spoken",
          level: { id: level.id, order: level.order, name: level.name },
        }}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Level {toRoman(level.order)}: {level.name}
          </Typography>
          {level.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {level.description}
            </Typography>
          )}
        </Box>

        {/* Units */}
        <Stack spacing={2}>
          {level.units.map((unit) => {
            const unitUnlocked = isUnitUnlocked(unit.id);
            const unitCompleted = unit.lessons.every((lesson) =>
              isLessonCompleted(lesson.id)
            );
            const completedLessonsCount = unit.lessons.filter((l) =>
              isLessonCompleted(l.id)
            ).length;

            return (
              <Card
                key={unit.id}
                elevation={0}
                sx={{
                  border: "2px solid",
                  borderColor: unitCompleted ? "success.main" : "divider",
                  opacity: unitUnlocked ? 1 : 0.6,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: unitUnlocked ? "primary.main" : "divider",
                    boxShadow: unitUnlocked ? 3 : 0,
                  },
                }}
              >
                <CardActionArea
                  onClick={() =>
                    unitUnlocked &&
                    router.push(`/curriculum/level/${levelId}/unit/${unit.id}`)
                  }
                  disabled={!unitUnlocked}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        {unitCompleted ? (
                          <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        ) : unitUnlocked ? (
                          <MenuBook color="primary" sx={{ fontSize: 40 }} />
                        ) : (
                          <Lock color="disabled" sx={{ fontSize: 40 }} />
                        )}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Unit {unit.order}: {unit.name}
                          </Typography>
                          {unit.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {unit.description}
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
                        {unit.lessons.length} lessons
                      </Typography>
                      <Typography
                        variant="body2"
                        color={
                          unitCompleted ? "success.main" : "text.secondary"
                        }
                        sx={{ fontWeight: 600 }}
                      >
                        {completedLessonsCount}/{unit.lessons.length} completed
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
}
