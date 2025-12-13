import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Alert,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import { LessonCard } from "./LessonCard";
import { TopNav } from "./TopNav";
import { isLocalEnvironment } from "../utils/environment";
import { getCachedLessons } from "../utils/offlineCache";

interface LessonSummary {
  id: string;
  title: string;
  vocabularyCount: number;
}

interface HomePageProps {
  onLessonClick?: (lessonId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLessonClick }) => {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [cachedLessons, setCachedLessons] = useState<Record<string, number>>(
    {}
  );
  const canCreateLessons = useMemo(() => isLocalEnvironment(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refreshCachedLessons = () => {
      const entries = getCachedLessons();
      setCachedLessons(
        entries.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.lessonId] = entry.cachedAt;
          return acc;
        }, {})
      );
    };

    refreshCachedLessons();
    window.addEventListener("focus", refreshCachedLessons);

    return () => {
      window.removeEventListener("focus", refreshCachedLessons);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lessons", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load lessons");
        }

        const data = await response.json();

        const normalized: LessonSummary[] = data.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          vocabularyCount:
            lesson._count?.vocabulary ?? lesson.vocabularyCount ?? 0,
        }));

        setLessons(normalized);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError((err as Error).message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();

    return () => {
      controller.abort();
    };
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

  const handleOpenCreateDialog = () => {
    if (!canCreateLessons) {
      return;
    }
    setCreateError(null);
    setNewLessonTitle("");
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (isCreatingLesson) {
      return;
    }
    setIsCreateDialogOpen(false);
    setCreateError(null);
  };

  const handleCreateLesson = async () => {
    if (!canCreateLessons) {
      return;
    }
    const trimmedTitle = newLessonTitle.trim();
    if (!trimmedTitle) {
      setCreateError("Please enter a lesson name");
      return;
    }

    setCreateError(null);
    setIsCreatingLesson(true);

    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create lesson");
      }

      const createdLesson = await response.json();
      const normalized: LessonSummary = {
        id: createdLesson.id,
        title: createdLesson.title,
        vocabularyCount:
          createdLesson._count?.vocabulary ??
          createdLesson.vocabularyCount ??
          0,
      };

      setLessons((prev) => [...prev, normalized]);
      setIsCreateDialogOpen(false);
      setNewLessonTitle("");
    } catch (err) {
      console.error("Failed to create lesson", err);
      setCreateError((err as Error).message || "Failed to create lesson");
    } finally {
      setIsCreatingLesson(false);
    }
  };

  return (
    <>
      <TopNav
        onCreateLesson={canCreateLessons ? handleOpenCreateDialog : undefined}
        isCreatingLesson={isCreatingLesson}
      />
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 4,
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            width: "100%",
          }}
        >
          {isLoading &&
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: { xs: "flex-start", md: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            ))}

          {error && (
            <Alert severity="error">
              {error || "We couldn't load your lessons. Please try again."}
            </Alert>
          )}

          {!isLoading && !error && lessons.length === 0 && (
            <Typography color="text.secondary">
              No lessons found. Come back later!
            </Typography>
          )}

          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={handleLessonClick}
              isCompleted={false}
              progress={0}
              isCached={Boolean(cachedLessons[lesson.id])}
              cachedAt={cachedLessons[lesson.id]}
            />
          ))}
        </Box>

        {canCreateLessons && (
          <Dialog
            open={isCreateDialogOpen}
            onClose={handleCloseCreateDialog}
            fullWidth
          >
            <DialogTitle>Create a lesson</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <TextField
                label="Lesson name"
                value={newLessonTitle}
                onChange={(event) => setNewLessonTitle(event.target.value)}
                autoFocus
                fullWidth
                disabled={isCreatingLesson}
                helperText={createError}
                error={Boolean(createError)}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseCreateDialog}
                disabled={isCreatingLesson}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLesson}
                variant="contained"
                disabled={isCreatingLesson}
              >
                {isCreatingLesson ? "Creating..." : "Create"}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </>
  );
};
