import React from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";

export interface LessonHeroProps {
  title: string;
  description: string;
  vocabularyCount: number;
  sentenceCount: number;
  onBackClick: () => void;
  onBulkUploadClick?: () => void;
}

export const LessonHero: React.FC<LessonHeroProps> = ({
  title,
  description,
  vocabularyCount,
  sentenceCount,
  onBackClick,
  onBulkUploadClick,
}) => (
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
          onClick={onBackClick}
          sx={{ pl: 0, mb: 1, color: "text.secondary" }}
        >
          Back to Lessons
        </Button>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        alignItems="center"
        justifyContent={{ xs: "flex-start", sm: "flex-end" }}
      >
        {onBulkUploadClick && (
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={onBulkUploadClick}
          >
            Bulk upload JSON
          </Button>
        )}
        <Chip
          color="primary"
          variant="outlined"
          label={`${vocabularyCount} vocab words`}
        />
        <Chip
          color="secondary"
          variant="outlined"
          label={`${sentenceCount} sentences`}
        />
      </Stack>
    </Stack>
  </Paper>
);
