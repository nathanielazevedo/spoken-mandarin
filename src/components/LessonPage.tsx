import React, { useMemo, useState } from "react";
import {
  Typography,
  Box,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  Stack,
} from "@mui/material";
import {
  School as FlashcardIcon,
  Chat as ConversationIcon,
  Psychology as PracticeIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { getLessonById } from "../data";
import { Flashcards } from "./Flashcards";
import { ConversationPractice } from "./ConversationPractice";
import { VocabularyPractice } from "./VocabularyPractice";

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showConversationPractice, setShowConversationPractice] =
    useState(false);
  const [showConversationFlashcards, setShowConversationFlashcards] =
    useState(false);
  const [showVocabularyPractice, setShowVocabularyPractice] = useState(false);

  const lesson = lessonId ? getLessonById(lessonId) : null;
  const conversationFlashcards = useMemo(() => {
    if (!lesson) {
      return [];
    }

    return lesson.conversation.turns.flatMap((turn) => [
      {
        id: `${turn.id}-bot`,
        pinyin: turn.bot.pinyin,
        english: turn.bot.english,
      },
      {
        id: `${turn.id}-user`,
        pinyin: turn.user.pinyin,
        english: turn.user.english,
      },
    ]);
  }, [lesson]);
  const turnCount = lesson?.conversation.turns.length ?? 0;
  const sentenceCount = turnCount * 2;

  if (!lesson) {
    return (
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 4,
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: "100%",
        }}
      >
        <Typography variant="h4">Lesson not found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          The lesson you're looking for doesn't exist.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
        <Paper
          sx={{
            mb: 4,
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            backgroundColor: (theme) => theme.palette.background.paper,
            boxShadow: (theme) => (theme.palette.mode === "dark" ? 4 : 2),
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/")}
                sx={{ pl: 0, mb: 1, color: "text.secondary" }}
              >
                Back to Lessons
              </Button>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {lesson.title}
              </Typography>
              <Typography color="text.secondary">
                Master {lesson.vocabulary.length} essential words and a{" "}
                {sentenceCount}-sentence dialogue built for real conversations.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                color="primary"
                variant="outlined"
                label={`${lesson.vocabulary.length} vocab words`}
              />
              <Chip
                color="secondary"
                variant="outlined"
                label={`${turnCount} dialogue turns`}
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper
          sx={{
            mb: 3,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            backgroundColor: (theme) => theme.palette.background.paper,
            border: "1px solid",
            borderColor: (theme) => theme.palette.divider,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FlashcardIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Vocabulary ({lesson.vocabulary.length} words)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {/* <Button
                variant="outlined"
                startIcon={<FlashcardIcon />}
                onClick={() => setShowFlashcards(true)}
              >
                Flashcards
              </Button> */}
              <Button
                variant="contained"
                startIcon={<PracticeIcon />}
                onClick={() => setShowVocabularyPractice(true)}
              >
                Practice
              </Button>
            </Stack>
          </Box>
          <Accordion
            sx={{
              mt: 2,
              // borderRadius: 2,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
            >
              <Typography fontWeight={600}>
                Tap to view vocabulary list
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(auto-fill, minmax(250px, 1fr))",
                    md: "repeat(auto-fill, minmax(280px, 1fr))",
                    lg: "repeat(auto-fill, minmax(300px, 1fr))",
                  },
                  gap: { xs: 2, sm: 3 },
                  width: "100%",
                }}
              >
                {lesson.vocabulary.map((vocab) => (
                  <Box
                    key={vocab.id}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      {vocab.pinyin}
                    </Typography>
                    <Typography variant="body1">{vocab.english}</Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>

        <Paper
          sx={{
            mb: 3,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            backgroundColor: (theme) => theme.palette.background.paper,
            border: "1px solid",
            borderColor: (theme) => theme.palette.divider,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ConversationIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Conversation: {lesson.conversation.title}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {/* <Button
                variant="outlined"
                startIcon={<FlashcardIcon />}
                onClick={() => setShowConversationFlashcards(true)}
              >
                Flashcards
              </Button> */}
              <Button
                variant="contained"
                startIcon={<PracticeIcon />}
                onClick={() => setShowConversationPractice(true)}
              >
                Practice
              </Button>
            </Stack>
          </Box>
          <Accordion
            sx={{
              mt: 2,
              borderRadius: 2,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
            >
              <Typography fontWeight={600}>
                Tap to rehearse the dialogue
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {lesson.conversation.turns.map((turn) => (
                  <Box
                    key={turn.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="primary.main"
                      sx={{ mb: 1 }}
                    >
                      Robot
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {turn.bot.pinyin}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {turn.bot.english}
                    </Typography>

                    <Divider
                      sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }}
                    />

                    <Typography
                      variant="subtitle2"
                      color="secondary.main"
                      sx={{ mb: 1 }}
                    >
                      You
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {turn.user.pinyin}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {turn.user.english}
                    </Typography>
                    {turn.user.hint && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        {turn.user.hint}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {showFlashcards && (
          <Flashcards
            vocabulary={lesson.vocabulary}
            onClose={() => setShowFlashcards(false)}
          />
        )}

        {showConversationFlashcards && (
          <Flashcards
            vocabulary={conversationFlashcards}
            onClose={() => setShowConversationFlashcards(false)}
          />
        )}

        {showVocabularyPractice && (
          <VocabularyPractice
            vocabulary={lesson.vocabulary}
            onClose={() => setShowVocabularyPractice(false)}
          />
        )}

        {showConversationPractice && (
          <ConversationPractice
            conversation={lesson.conversation}
            onClose={() => setShowConversationPractice(false)}
          />
        )}
      </Box>
    </Box>
  );
};
