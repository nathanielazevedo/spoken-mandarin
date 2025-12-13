import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

interface LessonOption {
  id: string;
  title: string;
  _count?: {
    vocabulary: number;
    sentences: number;
  };
}

export interface MoveToLessonDialogProps {
  open: boolean;
  currentLessonId: string;
  itemType: "vocabulary" | "sentence";
  itemLabel: string;
  onClose: () => void;
  onMove: (targetLessonId: string) => Promise<void> | void;
}

export const MoveToLessonDialog: React.FC<MoveToLessonDialogProps> = ({
  open,
  currentLessonId,
  itemType,
  itemLabel,
  onClose,
  onMove,
}) => {
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedLessonId(null);
      setError(null);
      return;
    }

    const fetchLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lessons");
        if (!response.ok) {
          throw new Error("Failed to fetch lessons");
        }
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load lessons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [open]);

  const availableLessons = lessons.filter((l) => l.id !== currentLessonId);

  const handleMove = async () => {
    if (!selectedLessonId) return;

    setIsMoving(true);
    setError(null);
    try {
      await onMove(selectedLessonId);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to move item");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Move {itemType === "vocabulary" ? "Word" : "Sentence"}
      </DialogTitle>
      <DialogContent>
        {itemLabel && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Moving: <strong>{itemLabel}</strong>
          </Typography>
        )}
        {isLoading ? (
          <CircularProgress
            size={24}
            sx={{ display: "block", mx: "auto", my: 4 }}
          />
        ) : error ? (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        ) : availableLessons.length === 0 ? (
          <Typography color="text.secondary" sx={{ my: 2 }}>
            No other lessons available.
          </Typography>
        ) : (
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {availableLessons.map((lesson) => (
              <ListItemButton
                key={lesson.id}
                selected={selectedLessonId === lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                disabled={isMoving}
              >
                <ListItemText
                  primary={lesson.title}
                  secondary={
                    lesson._count
                      ? `${lesson._count.vocabulary} words, ${lesson._count.sentences} sentences`
                      : undefined
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isMoving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleMove}
          disabled={!selectedLessonId || isMoving}
          startIcon={isMoving ? <CircularProgress size={16} /> : null}
        >
          {isMoving ? "Moving..." : "Move"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
