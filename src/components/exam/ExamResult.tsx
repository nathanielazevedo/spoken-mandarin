"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Replay as ReplayIcon,
} from "@mui/icons-material";

interface ExamResultProps {
  score: number;
  passed: boolean;
  passingScore: number;
  onRetry: () => void;
  onContinue: () => void;
}

export function ExamResult({
  score,
  passed,
  passingScore,
  onRetry,
  onContinue,
}: ExamResultProps) {
  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: "auto",
        p: 2,
        textAlign: "center",
      }}
    >
      <Card>
        <CardContent sx={{ py: 5 }}>
          {/* Icon */}
          <Box sx={{ mb: 3 }}>
            {passed ? (
              <CheckCircleIcon sx={{ fontSize: 80, color: "success.main" }} />
            ) : (
              <CancelIcon sx={{ fontSize: 80, color: "error.main" }} />
            )}
          </Box>

          {/* Title */}
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            {passed ? "Congratulations!" : "Keep Practicing"}
          </Typography>

          {/* Score */}
          <Box sx={{ position: "relative", display: "inline-flex", mb: 3 }}>
            <CircularProgress
              variant="determinate"
              value={score}
              size={120}
              thickness={4}
              sx={{
                color: passed ? "success.main" : "error.main",
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
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {score}%
              </Typography>
            </Box>
          </Box>

          {/* Message */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {passed ? (
              <>You passed! You needed {passingScore}% to pass.</>
            ) : (
              <>
                You needed {passingScore}% to pass. Review the lesson and try
                again.
              </>
            )}
          </Typography>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            {!passed && (
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            <Button variant="contained" onClick={onContinue}>
              {passed ? "Continue" : "Back to Lesson"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
