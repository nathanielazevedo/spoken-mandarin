import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type { Vocabulary } from "../types/lesson";

interface FlashcardsProps {
  vocabulary: Vocabulary[];
  onClose: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  vocabulary,
  onClose,
}) => {
  if (vocabulary.length === 0) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          p: 2,
        }}
      >
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            No flashcards available
          </Typography>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Card>
      </Box>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontSide, setFrontSide] = useState<"pinyin" | "english">("pinyin");

  const currentCard = vocabulary[currentIndex];
  const progress = ((currentIndex + 1) / vocabulary.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(
      (prev) => (prev - 1 + vocabulary.length) % vocabulary.length
    );
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleFrontSideChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSide: "pinyin" | "english" | null
  ) => {
    if (!newSide || newSide === frontSide) {
      return;
    }
    setFrontSide(newSide);
    setIsFlipped(false);
  };

  const isFrontPinyin = frontSide === "pinyin";
  const frontText = isFrontPinyin ? currentCard.pinyin : currentCard.english;
  const backText = isFrontPinyin ? currentCard.english : currentCard.pinyin;
  const frontColor = isFrontPinyin ? "primary.main" : "secondary.main";
  const backColor = isFrontPinyin ? "secondary.main" : "primary.main";
  const frontInstruction = isFrontPinyin
    ? "Tap to reveal meaning"
    : "Tap to reveal pinyin";

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
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            color: "white",
            gap: 1,
          }}
        >
          <Typography variant="h6">
            Flashcards ({currentIndex + 1} of {vocabulary.length})
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ToggleButtonGroup
              value={frontSide}
              exclusive
              size="small"
              onChange={handleFrontSideChange}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                "& .MuiToggleButton-root": {
                  color: "white",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  textTransform: "none",
                  px: 1.5,
                  "&.Mui-selected": {
                    color: "black",
                    bgcolor: "white",
                  },
                },
              }}
            >
              <ToggleButton value="pinyin">Pinyin first</ToggleButton>
              <ToggleButton value="english">English first</ToggleButton>
            </ToggleButtonGroup>
            <Box>
              <IconButton onClick={handleReset} sx={{ color: "white" }}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={onClose} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(255, 255, 255, 0.2)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              bgcolor: "primary.main",
            },
          }}
        />

        {/* Flashcard */}
        <Card
          sx={{
            minHeight: 300,
            cursor: "pointer",
            perspective: "1000px",
            bgcolor: "background.paper",
          }}
          onClick={handleFlip}
        >
          <CardContent
            sx={{
              height: "100%",
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              p: 4,
            }}
          >
            {!isFlipped ? (
              <>
                <Typography
                  variant="h3"
                  sx={{
                    color: frontColor,
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  }}
                >
                  {frontText}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {frontInstruction}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    color: backColor,
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                  }}
                >
                  {backText}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton
            onClick={handlePrev}
            disabled={vocabulary.length <= 1}
            sx={{
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <PrevIcon />
          </IconButton>

          <Button
            variant="outlined"
            onClick={handleFlip}
            sx={{
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.3)",
              "&:hover": { borderColor: "white" },
            }}
          >
            {isFlipped
              ? `Show ${isFrontPinyin ? "Pinyin" : "English"}`
              : `Show ${isFrontPinyin ? "English" : "Pinyin"}`}
          </Button>

          <IconButton
            onClick={handleNext}
            disabled={vocabulary.length <= 1}
            sx={{
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <NextIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
