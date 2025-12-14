"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  VolumeUp as AudioIcon,
} from "@mui/icons-material";

type QuestionType =
  | "LISTENING"
  | "TRANSLATE_TO_ENGLISH"
  | "TRANSLATE_TO_CHINESE"
  | "FILL_BLANK"
  | "MULTIPLE_CHOICE"
  | "SPEAKING";

interface ExamQuestion {
  id: string;
  type: QuestionType;
  order: number;
  prompt: string;
  correctAnswer: string;
  options: string[] | null;
  promptAudioUrl: string | null;
  explanation: string | null;
  points: number;
}

interface Exam {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  questions: ExamQuestion[];
}

interface LessonInfo {
  id: string;
  name: string;
}

const questionTypeLabels: Record<QuestionType, string> = {
  LISTENING: "Listening",
  TRANSLATE_TO_ENGLISH: "Translate to English",
  TRANSLATE_TO_CHINESE: "Translate to Chinese",
  FILL_BLANK: "Fill in the Blank",
  MULTIPLE_CHOICE: "Multiple Choice",
  SPEAKING: "Speaking",
};

const questionTypeColors: Record<
  QuestionType,
  "primary" | "secondary" | "success" | "warning" | "info" | "error"
> = {
  LISTENING: "info",
  TRANSLATE_TO_ENGLISH: "primary",
  TRANSLATE_TO_CHINESE: "secondary",
  FILL_BLANK: "success",
  MULTIPLE_CHOICE: "warning",
  SPEAKING: "error",
};

export default function ExamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // Form state
  const [questionType, setQuestionType] =
    useState<QuestionType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(10);
  const [promptAudioUrl, setPromptAudioUrl] = useState("");

  // Exam settings dialog
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | "">("");

  useEffect(() => {
    fetchExam();
  }, [lessonId]);

  async function fetchExam() {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${lessonId}/exam`);

      if (response.status === 404) {
        // No exam exists yet
        setExam(null);
        // Fetch lesson info separately
        const lessonResponse = await fetch(`/api/lessons/${lessonId}`);
        if (lessonResponse.ok) {
          const lessonData = await lessonResponse.json();
          setLessonInfo({ id: lessonData.id, name: lessonData.name });
        }
      } else if (!response.ok) {
        throw new Error("Failed to fetch exam");
      } else {
        const data = await response.json();
        setExam(data.exam);
        setLessonInfo({
          id: data.exam.lessonId,
          name: data.lessonName || "Lesson",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exam");
    } finally {
      setLoading(false);
    }
  }

  async function createExam() {
    try {
      setSaving(true);
      const response = await fetch(`/api/lessons/${lessonId}/exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${lessonInfo?.name || "Lesson"} Exam`,
          passingScore: 70,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create exam");
      }

      await fetchExam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setSaving(false);
    }
  }

  function openQuestionDialog(question?: ExamQuestion) {
    if (question) {
      setEditingQuestion(question);
      setQuestionType(question.type);
      setPrompt(question.prompt);
      setCorrectAnswer(question.correctAnswer);
      setOptions(question.options || ["", "", "", ""]);
      setExplanation(question.explanation || "");
      setPoints(question.points);
      setPromptAudioUrl(question.promptAudioUrl || "");
    } else {
      setEditingQuestion(null);
      setQuestionType("MULTIPLE_CHOICE");
      setPrompt("");
      setCorrectAnswer("");
      setOptions(["", "", "", ""]);
      setExplanation("");
      setPoints(10);
      setPromptAudioUrl("");
    }
    setDialogOpen(true);
  }

  async function handleSaveQuestion() {
    if (!exam || !prompt.trim() || !correctAnswer.trim()) return;

    setSaving(true);
    setError(null);

    const questionData = {
      type: questionType,
      prompt: prompt.trim(),
      correctAnswer: correctAnswer.trim(),
      options:
        questionType === "MULTIPLE_CHOICE"
          ? options.filter((o) => o.trim())
          : null,
      explanation: explanation.trim() || null,
      points,
      promptAudioUrl: promptAudioUrl.trim() || null,
    };

    try {
      let response;
      if (editingQuestion) {
        response = await fetch(
          `/api/lessons/${lessonId}/exam/questions/${editingQuestion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          }
        );
      } else {
        response = await fetch(`/api/lessons/${lessonId}/exam/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save question");
      }

      setDialogOpen(false);
      await fetchExam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(
        `/api/lessons/${lessonId}/exam/questions/${questionId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      await fetchExam();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete question"
      );
    }
  }

  function openSettingsDialog() {
    if (exam) {
      setExamTitle(exam.title);
      setExamDescription(exam.description || "");
      setPassingScore(exam.passingScore);
      setTimeLimit(exam.timeLimit || "");
    }
    setSettingsDialogOpen(true);
  }

  async function handleSaveSettings() {
    if (!exam) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/exam`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle.trim(),
          description: examDescription.trim() || null,
          passingScore,
          timeLimit: timeLimit || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save exam settings");
      }

      setSettingsDialogOpen(false);
      await fetchExam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push("/admin/curriculum")}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Exam Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lessonInfo?.name || "Lesson"}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!exam ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No exam exists for this lesson
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create an exam to add questions for students to complete after this
            lesson.
          </Typography>
          <Button
            variant="contained"
            onClick={createExam}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Exam
          </Button>
        </Paper>
      ) : (
        <>
          {/* Exam Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {exam.title}
                </Typography>
                {exam.description && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {exam.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Chip label={`Passing: ${exam.passingScore}%`} size="small" />
                  <Chip
                    label={
                      exam.timeLimit ? `${exam.timeLimit} min` : "No time limit"
                    }
                    size="small"
                  />
                  <Chip
                    label={`${exam.questions.length} questions`}
                    size="small"
                  />
                </Box>
              </Box>
              <Button variant="outlined" onClick={openSettingsDialog}>
                Edit Settings
              </Button>
            </Box>
          </Paper>

          {/* Questions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Questions</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openQuestionDialog()}
            >
              Add Question
            </Button>
          </Box>

          {exam.questions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No questions yet. Click "Add Question" to create your first
                question.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {exam.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <Card key={question.id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                        >
                          <DragIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {index + 1}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mb: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={questionTypeLabels[question.type]}
                              size="small"
                              color={questionTypeColors[question.type]}
                            />
                            <Chip
                              label={`${question.points} pts`}
                              size="small"
                              variant="outlined"
                            />
                            {question.promptAudioUrl && (
                              <Chip
                                icon={<AudioIcon fontSize="small" />}
                                label="Audio"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography sx={{ fontWeight: 500, mb: 1 }}>
                            {question.prompt}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Answer: {question.correctAnswer}
                          </Typography>
                          {question.options && question.options.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Options: {question.options.join(", ")}
                            </Typography>
                          )}
                          {question.explanation && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Explanation: {question.explanation}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openQuestionDialog(question)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))}
            </Box>
          )}
        </>
      )}

      {/* Add/Edit Question Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? "Edit Question" : "Add Question"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={questionType}
                  label="Question Type"
                  onChange={(e) =>
                    setQuestionType(e.target.value as QuestionType)
                  }
                >
                  {Object.entries(questionTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Points"
                type="number"
                fullWidth
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Prompt"
                fullWidth
                multiline
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  questionType === "LISTENING"
                    ? "The audio will play. What did you hear?"
                    : questionType === "TRANSLATE_TO_ENGLISH"
                    ? "Translate: 你好"
                    : questionType === "TRANSLATE_TO_CHINESE"
                    ? "Translate: Hello"
                    : questionType === "FILL_BLANK"
                    ? "Complete: 我___(want)去商店"
                    : "Enter the question prompt"
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Correct Answer"
                fullWidth
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              />
            </Grid>

            {questionType === "MULTIPLE_CHOICE" && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Answer Options
                  </Typography>
                </Grid>
                {options.map((option, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={`Option ${index + 1}`}
                      fullWidth
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                    />
                  </Grid>
                ))}
              </>
            )}

            {questionType === "LISTENING" && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Audio URL"
                  fullWidth
                  value={promptAudioUrl}
                  onChange={(e) => setPromptAudioUrl(e.target.value)}
                  placeholder="https://..."
                  helperText="URL to the audio file for this question"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Explanation (optional)"
                fullWidth
                multiline
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this is the correct answer"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuestion}
            variant="contained"
            disabled={!prompt.trim() || !correctAnswer.trim() || saving}
          >
            {saving ? (
              <CircularProgress size={20} />
            ) : editingQuestion ? (
              "Save"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Exam Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Exam Title"
              fullWidth
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
              value={examDescription}
              onChange={(e) => setExamDescription(e.target.value)}
            />
            <TextField
              label="Passing Score (%)"
              type="number"
              fullWidth
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Time Limit (minutes, optional)"
              type="number"
              fullWidth
              value={timeLimit}
              onChange={(e) =>
                setTimeLimit(e.target.value ? parseInt(e.target.value) : "")
              }
              inputProps={{ min: 1 }}
              helperText="Leave empty for no time limit"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSettingsDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={!examTitle.trim() || saving}
          >
            {saving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
