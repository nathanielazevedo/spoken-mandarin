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
  Chip,
} from "@mui/material";
import {
  PlayLesson,
  CheckCircle,
  Lock,
  ArrowBack,
} from "@mui/icons-material";
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

export default function UnitPage({
  params,
}: {
  params: Promise<{ levelId: string; unitId: string }>;
}) {
  const [levelId, setLevelId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const {
    isLessonUnlocked,
    isLessonCompleted,
    loading: progressLoading,
  } = useProgress();

  // Unwrap params Promise
  useEffect(() => {
    params.then((p) => {
      setLevelId(p.levelId);
      setUnitId(p.unitId);
    });
  }, [params]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!levelId || !unitId) return;

    const fetchUnit = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/curriculum");
        if (!response.ok) throw new Error("Failed to fetch curriculum");

        const data = await response.json();
        const program = data[0];
        const foundLevel = program?.levels.find((l: any) => l.id === levelId);
        const foundUnit = foundLevel?.units.find((u: Unit) => u.id === unitId);

        if (!foundUnit || !foundLevel) {
          setError("Unit not found");
          return;
        }

        setUnit(foundUnit);
        setLevel({
          id: foundLevel.id,
          order: foundLevel.order,
          name: foundLevel.name,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnit();
  }, [levelId, unitId, user, router]);

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
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={150} />
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !unit || !level) {
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
          <Alert severity="error">{error || "Unit not found"}</Alert>
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
          unit: { id: unit.id, order: unit.order, name: unit.name },
        }}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Unit {unit.order}: {unit.name}
          </Typography>
          {unit.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {unit.description}
            </Typography>
          )}
        </Box>

        {/* Lessons */}
        <Stack spacing={2}>
          {unit.lessons.map((lesson) => {
            const lessonUnlocked = isLessonUnlocked(lesson.id);
            const lessonCompleted = isLessonCompleted(lesson.id);

            return (
              <Card
                key={lesson.id}
                elevation={0}
                sx={{
                  border: "2px solid",
                  borderColor: lessonCompleted ? "success.main" : "divider",
                  bgcolor: "background.paper",
                  opacity: lessonUnlocked ? 1 : 0.6,
                  transition: "all 0.2s ease",
                  "&:hover": lessonUnlocked
                    ? {
                        borderColor: "primary.main",
                        boxShadow: 3,
                      }
                    : {},
                }}
              >
                <CardActionArea
                  onClick={() => handleLessonClick(lesson.id)}
                  disabled={!lessonUnlocked}
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
                        {lessonCompleted ? (
                          <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        ) : lessonUnlocked ? (
                          <PlayLesson color="primary" sx={{ fontSize: 40 }} />
                        ) : (
                          <Lock color="disabled" sx={{ fontSize: 40 }} />
                        )}
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {lesson.name}
                            </Typography>
                          </Box>
                          {lesson.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {lesson.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label={`${lesson._count.vocabulary} words`}
                              size="small"
                              sx={{ bgcolor: "action.hover" }}
                            />
                            <Chip
                              label={`${lesson._count.sentences} sentences`}
                              size="small"
                              sx={{ bgcolor: "action.hover" }}
                            />
                              </>
                            )}
                            {lessonCompleted && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                label="Completed"
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </Box>
                      </Box>
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
