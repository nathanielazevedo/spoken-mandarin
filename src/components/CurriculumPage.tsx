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
} from "@mui/material";
import {
  ExpandMore,
  School,
  MenuBook,
  PlayLesson,
  CheckCircle,
  Lock,
} from "@mui/icons-material";
import { TopNav } from "./TopNav";

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
  const [expandedLevel, setExpandedLevel] = useState<string | false>(false);
  const [expandedUnit, setExpandedUnit] = useState<string | false>(false);

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

  if (isLoading) {
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
        {/* Levels */}
        {program.levels.map((level) => (
          <Accordion
            key={level.id}
            expanded={expandedLevel === level.id}
            onChange={handleLevelChange(level.id)}
            sx={{
              mb: 2,
              borderRadius: 2,
              "&:before": { display: "none" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              "&.Mui-expanded": {
                boxShadow: "0 4px 16px rgba(220,38,38,0.15)",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
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
                    {level.units.reduce((acc, u) => acc + u.lessons.length, 0)}{" "}
                    lessons
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, bgcolor: "background.paper" }}>
              {/* Units within Level */}
              <Stack spacing={0}>
                {level.units.map((unit, unitIndex) => (
                  <Accordion
                    key={unit.id}
                    expanded={expandedUnit === unit.id}
                    onChange={handleUnitChange(unit.id)}
                    sx={{
                      "&:before": { display: "none" },
                      boxShadow: "none",
                      border: "1px solid",
                      borderColor: "divider",
                      borderTop: unitIndex === 0 ? "1px solid" : "none",
                      borderTopColor: "divider",
                      borderRadius:
                        unitIndex === 0 && unitIndex === level.units.length - 1
                          ? 2
                          : unitIndex === 0
                          ? "8px 8px 0 0"
                          : unitIndex === level.units.length - 1
                          ? "0 0 8px 8px"
                          : 0,
                      overflow: "hidden",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        bgcolor:
                          expandedUnit === unit.id
                            ? "action.selected"
                            : "background.paper",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <MenuBook color="primary" />
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            Unit {unit.order}: {unit.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {unit.lessons.length} lessons
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                      {/* Lessons within Unit */}
                      <Stack spacing={1.5}>
                        {unit.lessons.map((lesson, index) => (
                          <Card
                            key={lesson.id}
                            elevation={0}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "primary.main",
                                boxShadow: "0 4px 12px rgba(220,38,38,0.1)",
                                transform: "translateX(4px)",
                              },
                            }}
                          >
                            <CardActionArea
                              onClick={() => handleLessonClick(lesson.id)}
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
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                  }}
                                >
                                  {lesson.order}
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
                                  </Stack>
                                </Box>
                                <PlayLesson color="action" />
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
};
