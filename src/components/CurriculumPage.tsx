"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Skeleton,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  ExpandMore,
  School,
  MenuBook,
  PlayLesson,
  CheckCircle,
  Lock,
  EmojiEvents,
  Login,
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
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(30,30,30,0.95) 100%)"
            : "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(255,255,255,0.95) 100%)",
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
  const [expandedLevel, setExpandedLevel] = useState<string | false>(false);
  const [expandedUnit, setExpandedUnit] = useState<string | false>(false);

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    isLessonUnlocked,
    isLessonCompleted,
    isUnitUnlocked,
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

        // Auto-expand first level and unit if available
        if (data[0]?.levels?.[0]) {
          setExpandedLevel(data[0].levels[0].id);
          if (data[0].levels[0].units?.[0]) {
            setExpandedUnit(data[0].levels[0].units[0].id);
          }
        }
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

  const handleLevelChange =
    (levelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedLevel(isExpanded ? levelId : false);
    };

  const handleUnitChange =
    (unitId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedUnit(isExpanded ? unitId : false);
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
        {program.levels.map((level) => {
          const levelUnlocked = isLevelUnlocked(level.id);
          const levelCompleted = level.units.every((unit) =>
            unit.lessons.every((lesson) => isLessonCompleted(lesson.id))
          );

          return (
            <Accordion
              key={level.id}
              expanded={expandedLevel === level.id}
              onChange={handleLevelChange(level.id)}
              disabled={!levelUnlocked}
              sx={{
                mb: 2,
                borderRadius: 2,
                "&:before": { display: "none" },
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                opacity: levelUnlocked ? 1 : 0.6,
                "&.Mui-expanded": {
                  boxShadow: "0 4px 16px rgba(220,38,38,0.15)",
                },
              }}
            >
              <AccordionSummary
                expandIcon={levelUnlocked ? <ExpandMore /> : <Lock />}
                sx={{
                  bgcolor:
                    expandedLevel === level.id
                      ? "primary.main"
                      : "background.paper",
                  color:
                    expandedLevel === level.id
                      ? "primary.contrastText"
                      : "text.primary",
                  borderRadius:
                    expandedLevel === level.id ? "8px 8px 0 0" : "8px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor:
                      expandedLevel === level.id
                        ? "primary.dark"
                        : "action.hover",
                  },
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    color:
                      expandedLevel === level.id
                        ? "primary.contrastText"
                        : "text.secondary",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <School />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Level {toRoman(level.order)}: {level.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.8,
                        color:
                          expandedLevel === level.id
                            ? "inherit"
                            : "text.secondary",
                      }}
                    >
                      {level.units.length} units •{" "}
                      {level.units.reduce(
                        (acc, u) => acc + u.lessons.length,
                        0
                      )}{" "}
                      lessons
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, bgcolor: "background.paper" }}>
                {/* Units within Level */}
                <Stack spacing={0}>
                  {level.units.map((unit, unitIndex) => {
                    const unitUnlocked = isUnitUnlocked(unit.id);
                    const unitCompleted = unit.lessons.every((lesson) =>
                      isLessonCompleted(lesson.id)
                    );

                    return (
                      <Accordion
                        key={unit.id}
                        expanded={expandedUnit === unit.id}
                        onChange={handleUnitChange(unit.id)}
                        disabled={!unitUnlocked}
                        sx={{
                          "&:before": { display: "none" },
                          boxShadow: "none",
                          border: "1px solid",
                          borderColor: "divider",
                          borderTop: unitIndex === 0 ? "1px solid" : "none",
                          borderTopColor: "divider",
                          borderRadius:
                            unitIndex === 0 &&
                            unitIndex === level.units.length - 1
                              ? 2
                              : unitIndex === 0
                              ? "8px 8px 0 0"
                              : unitIndex === level.units.length - 1
                              ? "0 0 8px 8px"
                              : 0,
                          overflow: "hidden",
                          opacity: unitUnlocked ? 1 : 0.6,
                        }}
                      >
                        <AccordionSummary
                          expandIcon={unitUnlocked ? <ExpandMore /> : <Lock />}
                          sx={{
                            bgcolor:
                              expandedUnit === unit.id
                                ? "action.selected"
                                : "background.paper",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {unitCompleted ? (
                              <CheckCircle color="success" />
                            ) : (
                              <MenuBook
                                color={unitUnlocked ? "primary" : "disabled"}
                              />
                            )}
                            <Box>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                              >
                                Unit {unit.order}: {unit.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {unit.lessons.length} lessons
                              </Typography>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2 }}>
                          {/* Lessons within Unit */}
                          <Stack spacing={1.5}>
                            {unit.lessons.map((lesson, index) => {
                              const unlocked = isLessonUnlocked(lesson.id);
                              const completed = isLessonCompleted(lesson.id);
                              const isUnitFinal = lesson.isUnitFinal;

                              return (
                                <Card
                                  key={lesson.id}
                                  elevation={0}
                                  sx={{
                                    border: isUnitFinal
                                      ? "2px solid"
                                      : "1px solid",
                                    borderColor: completed
                                      ? "success.main"
                                      : isUnitFinal
                                      ? "warning.main"
                                      : unlocked
                                      ? "divider"
                                      : "divider",
                                    borderRadius: 2,
                                    transition: "all 0.2s ease",
                                    opacity: unlocked ? 1 : 0.6,
                                    bgcolor: completed
                                      ? "success.50"
                                      : isUnitFinal
                                      ? (theme) =>
                                          theme.palette.mode === "dark"
                                            ? "rgba(237, 137, 54, 0.1)"
                                            : "rgba(237, 137, 54, 0.05)"
                                      : "background.paper",
                                    "&:hover": unlocked
                                      ? {
                                          borderColor: isUnitFinal
                                            ? "warning.dark"
                                            : "primary.main",
                                          boxShadow: isUnitFinal
                                            ? "0 4px 12px rgba(237,137,54,0.2)"
                                            : "0 4px 12px rgba(220,38,38,0.1)",
                                          transform: "translateX(4px)",
                                        }
                                      : {},
                                  }}
                                >
                                  <Tooltip
                                    title={
                                      !unlocked
                                        ? "Complete previous lessons to unlock"
                                        : ""
                                    }
                                    placement="top"
                                  >
                                    <CardActionArea
                                      onClick={() =>
                                        handleLessonClick(lesson.id)
                                      }
                                      disabled={!unlocked}
                                      sx={{
                                        cursor: unlocked
                                          ? "pointer"
                                          : "not-allowed",
                                      }}
                                    >
                                      <CardContent
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 2,
                                          py: 1.5,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            bgcolor: completed
                                              ? "success.main"
                                              : isUnitFinal
                                              ? "warning.main"
                                              : unlocked
                                              ? "primary.main"
                                              : "grey.400",
                                            color:
                                              completed || isUnitFinal
                                                ? "white"
                                                : "primary.contrastText",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                          }}
                                        >
                                          {completed ? (
                                            <CheckCircle
                                              sx={{ fontSize: 24 }}
                                            />
                                          ) : isUnitFinal ? (
                                            <EmojiEvents
                                              sx={{ fontSize: 24 }}
                                            />
                                          ) : unlocked ? (
                                            lesson.order
                                          ) : (
                                            <Lock sx={{ fontSize: 20 }} />
                                          )}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {lesson.name}
                                          </Typography>
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ mt: 0.5 }}
                                          >
                                            {isUnitFinal ? (
                                              <Chip
                                                icon={
                                                  <EmojiEvents
                                                    sx={{ fontSize: 14 }}
                                                  />
                                                }
                                                label="Unit Final Exam"
                                                size="small"
                                                color="warning"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.7rem",
                                                  "& .MuiChip-icon": {
                                                    fontSize: 14,
                                                  },
                                                }}
                                              />
                                            ) : (
                                              <>
                                                <Chip
                                                  label={`${lesson._count.vocabulary} words`}
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    fontSize: "0.7rem",
                                                    bgcolor: "action.hover",
                                                  }}
                                                />
                                                <Chip
                                                  label={`${lesson._count.sentences} sentences`}
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    fontSize: "0.7rem",
                                                    bgcolor: "action.hover",
                                                  }}
                                                />
                                              </>
                                            )}
                                            {completed && (
                                              <Chip
                                                label="Completed"
                                                size="small"
                                                color="success"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.7rem",
                                                }}
                                              />
                                            )}
                                          </Stack>
                                        </Box>
                                        {unlocked ? (
                                          <PlayLesson
                                            color={
                                              completed ? "success" : "action"
                                            }
                                          />
                                        ) : (
                                          <Lock color="disabled" />
                                        )}
                                      </CardContent>
                                    </CardActionArea>
                                  </Tooltip>
                                </Card>
                              );
                            })}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Container>
    </Box>
  );
};
