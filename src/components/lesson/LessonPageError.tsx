import React from "react";
import { Alert, Box, Button } from "@mui/material";

export interface LessonPageErrorProps {
  error: string | null;
  onBackClick: () => void;
}

export const LessonPageError: React.FC<LessonPageErrorProps> = ({
  error,
  onBackClick,
}) => {
  return (
    <Box
      sx={{
        pt: { xs: 2, sm: 3 },
        pb: 4,
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        width: "100%",
      }}
    >
      <Alert severity="error" sx={{ mb: 2 }}>
        {error || "Lesson not found"}
      </Alert>
      <Button variant="contained" onClick={onBackClick}>
        Back to lessons
      </Button>
    </Box>
  );
};
