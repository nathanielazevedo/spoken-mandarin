import React from "react";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

export interface LessonHeroProps {
  title: string;
  description?: string;
  onBackClick: () => void;
  onBulkUploadClick?: () => void;
}

export const LessonHero: React.FC<LessonHeroProps> = ({
  title,
  description,
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
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary">{description}</Typography>
        )}
      </Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        {onBulkUploadClick && (
          <Tooltip title="Bulk upload JSON">
            <IconButton
              onClick={onBulkUploadClick}
              color="primary"
              aria-label="Bulk upload JSON"
              sx={{
                border: 1,
                borderColor: "divider",
                width: 48,
                height: 48,
              }}
            >
              <UploadFileRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  </Paper>
);
