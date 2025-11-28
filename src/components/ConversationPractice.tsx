import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RestartIcon,
} from "@mui/icons-material";
import type { Conversation, ConversationTurn } from "../types/lesson";
import { normalizePinyin } from "../utils/pinyin";

interface ConversationPracticeProps {
  conversation: Conversation;
  onClose: () => void;
}

interface Message {
  speaker: "bot" | "user";
  text: string;
  isCorrect?: boolean;
}

const isResponseValid = (input: string, turn?: ConversationTurn): boolean => {
  if (!turn) {
    return false;
  }

  const normalizedInput = normalizePinyin(input);
  const normalizedExpected = normalizePinyin(turn.user.pinyin);
  const rules = turn.validation;

  if (!rules) {
    return normalizedInput === normalizedExpected;
  }

  if (rules.exact && normalizedInput !== normalizePinyin(rules.exact)) {
    return false;
  }

  if (
    rules.startsWith &&
    !normalizedInput.startsWith(normalizePinyin(rules.startsWith))
  ) {
    return false;
  }

  if (
    rules.endsWith &&
    !normalizedInput.endsWith(normalizePinyin(rules.endsWith))
  ) {
    return false;
  }

  if (rules.mustInclude) {
    const missing = rules.mustInclude.some(
      (fragment) => !normalizedInput.includes(normalizePinyin(fragment))
    );

    if (missing) {
      return false;
    }
  }

  return true;
};

export const ConversationPractice: React.FC<ConversationPracticeProps> = ({
  conversation,
  onClose,
}) => {
  const firstTurn = conversation.turns[0];
  const [messages, setMessages] = useState<Message[]>(
    firstTurn
      ? [
          {
            speaker: "bot",
            text: firstTurn.bot.pinyin,
          },
        ]
      : []
  );
  const [userInput, setUserInput] = useState("");
  const [turnIndex, setTurnIndex] = useState(
    firstTurn ? 0 : conversation.turns.length
  );
  const [isComplete, setIsComplete] = useState(conversation.turns.length === 0);

  const handleSendMessage = () => {
    if (!userInput.trim() || isComplete) {
      return;
    }

    const currentTurn = conversation.turns[turnIndex];

    if (!currentTurn) {
      return;
    }

    const trimmedInput = userInput.trim();
    const isCorrect = isResponseValid(trimmedInput, currentTurn);

    const userMessage: Message = {
      speaker: "user",
      text: trimmedInput,
      isCorrect,
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    if (!isCorrect) {
      return;
    }

    const nextTurnIndex = turnIndex + 1;

    if (nextTurnIndex < conversation.turns.length) {
      const nextBotLine = conversation.turns[nextTurnIndex].bot.pinyin;
      setTurnIndex(nextTurnIndex);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "bot",
            text: nextBotLine,
          },
        ]);
      }, 800);
    } else {
      setTurnIndex(nextTurnIndex);
      setTimeout(() => {
        setIsComplete(true);
      }, 600);
    }
  };

  const handleRestart = () => {
    const restartTurn = conversation.turns[0];
    setMessages(
      restartTurn
        ? [
            {
              speaker: "bot",
              text: restartTurn.bot.pinyin,
            },
          ]
        : []
    );
    setUserInput("");
    setTurnIndex(restartTurn ? 0 : conversation.turns.length);
    setIsComplete(conversation.turns.length === 0);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">Practice: {conversation.title}</Typography>
          <Box>
            <IconButton onClick={handleRestart} size="small">
              <RestartIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minHeight: 300,
            maxHeight: 400,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={`${message.speaker}-${index}`}
              sx={{
                display: "flex",
                justifyContent:
                  message.speaker === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              {message.speaker === "bot" && (
                <BotIcon sx={{ color: "primary.main", mt: 0.5 }} />
              )}
              <Paper
                sx={{
                  p: 2,
                  maxWidth: "70%",
                  bgcolor:
                    message.speaker === "bot"
                      ? "background.paper"
                      : message.isCorrect === false
                      ? "error.dark"
                      : message.isCorrect === true
                      ? "success.dark"
                      : "primary.main",
                  color: message.speaker === "bot" ? "text.primary" : "white",
                  border: "1px solid",
                  borderColor:
                    message.speaker === "bot" ? "divider" : "transparent",
                }}
              >
                <Typography variant="body1">{message.text}</Typography>
                {message.isCorrect === false && (
                  <Chip
                    label="Try again"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
                {message.isCorrect === true && (
                  <Chip
                    label="Correct!"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>
              {message.speaker === "user" && (
                <PersonIcon sx={{ color: "text.secondary", mt: 0.5 }} />
              )}
            </Box>
          ))}

          {isComplete && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" color="success.main">
                🎉 Conversation Complete!
              </Typography>
              <Button
                variant="contained"
                onClick={handleRestart}
                sx={{ mt: 2 }}
                startIcon={<RestartIcon />}
              >
                Practice Again
              </Button>
            </Box>
          )}
        </Box>

        {!isComplete && (
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              placeholder="Type your response in pinyin..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              sx={{ minWidth: "auto", px: 2 }}
            >
              <SendIcon />
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
};
