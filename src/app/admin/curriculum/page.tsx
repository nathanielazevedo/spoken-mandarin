"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Quiz as QuizIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  name: string;
  order: number;
}

interface Unit {
  id: string;
  name: string;
  order: number;
  lessons: Lesson[];
}

interface Level {
  id: string;
  name: string;
  order: number;
  description: string | null;
  units: Unit[];
}

interface Program {
  id: string;
  name: string;
  levels: Level[];
}

type DialogType = "level" | "unit" | "lesson";

export default function AdminCurriculumPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("level");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  async function fetchCurriculum() {
    try {
      const response = await fetch("/api/admin/curriculum");
      if (!response.ok) {
        throw new Error("Failed to fetch curriculum");
      }
      const data = await response.json();
      setPrograms(data.programs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch curriculum"
      );
    } finally {
      setLoading(false);
    }
  }

  function openDialog(type: DialogType, parentId: string) {
    setDialogType(type);
    setSelectedParentId(parentId);
    setNewName("");
    setNewDescription("");
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!selectedParentId || !newName.trim()) return;

    setCreating(true);
    setError(null);

    const endpoints: Record<DialogType, { url: string; parentKey: string }> = {
      level: { url: "/api/admin/curriculum/levels", parentKey: "programId" },
      unit: { url: "/api/admin/curriculum/units", parentKey: "levelId" },
      lesson: { url: "/api/admin/curriculum/lessons", parentKey: "unitId" },
    };

    const { url, parentKey } = endpoints[dialogType];

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [parentKey]: selectedParentId,
          name: newName.trim(),
          description: newDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to create ${dialogType}`);
      }

      setDialogOpen(false);
      fetchCurriculum();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to create ${dialogType}`
      );
    } finally {
      setCreating(false);
    }
  }

  const dialogTitles: Record<DialogType, string> = {
    level: "Create New Level",
    unit: "Create New Unit",
    lesson: "Create New Lesson",
  };

  const dialogPlaceholders: Record<DialogType, string> = {
    level: "e.g., Beginner, Intermediate, Advanced",
    unit: "e.g., Greetings, Numbers, Family",
    lesson: "e.g., Hello & Goodbye, Counting 1-10",
  };

  // Helper to convert number to Roman numeral
  const toRoman = (num: number): string => {
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
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Curriculum
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {programs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">No programs found.</Typography>
        </Paper>
      ) : (
        programs.map((program) => (
          <Paper key={program.id} sx={{ mb: 3, overflow: "hidden" }}>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {program.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {program.levels.length} level
                  {program.levels.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={() => openDialog("level", program.id)}
              >
                Add Level
              </Button>
            </Box>

            <Box sx={{ p: 2 }}>
              {program.levels.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center" }}
                >
                  No levels yet. Click "Add Level" to create one.
                </Typography>
              ) : (
                program.levels.map((level) => (
                  <Accordion key={level.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flex: 1,
                        }}
                      >
                        <Chip
                          label={`Level ${toRoman(level.order)}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography sx={{ fontWeight: 500 }}>
                          {level.name}
                        </Typography>
                        <Chip
                          label={`${level.units.length} unit${
                            level.units.length !== 1 ? "s" : ""
                          }`}
                          size="small"
                          variant="outlined"
                        />
                        <Box sx={{ flex: 1 }} />
                        <Tooltip title="Add Unit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog("unit", level.id);
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {level.units.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No units in this level.
                        </Typography>
                      ) : (
                        level.units.map((unit) => (
                          <Accordion key={unit.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  flex: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  Unit {unit.order}: {unit.name}
                                </Typography>
                                <Chip
                                  label={`${unit.lessons.length} lesson${
                                    unit.lessons.length !== 1 ? "s" : ""
                                  }`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Box sx={{ flex: 1 }} />
                                <Tooltip title="Add Lesson">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDialog("lesson", unit.id);
                                    }}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {unit.lessons.length === 0 ? (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No lessons in this unit.
                                </Typography>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                  }}
                                >
                                  {unit.lessons.map((lesson) => (
                                    <Box
                                      key={lesson.id}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        py: 1,
                                        px: 2,
                                        bgcolor: "grey.50",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {lesson.order}. {lesson.name}
                                      </Typography>
                                      <Tooltip title="Manage Exam">
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            router.push(
                                              `/admin/curriculum/lessons/${lesson.id}/exam`
                                            )
                                          }
                                          color="primary"
                                        >
                                          <QuizIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        ))
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          </Paper>
        ))
      )}

      {/* Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialogTitles[dialogType]}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label={`${
              dialogType.charAt(0).toUpperCase() + dialogType.slice(1)
            } Name`}
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 2 }}
            placeholder={dialogPlaceholders[dialogType]}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!newName.trim() || creating}
          >
            {creating ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
