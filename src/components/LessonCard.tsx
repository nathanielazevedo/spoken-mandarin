import React from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
interface LessonSummary {
  id: string;
  title: string;
  vocabularyCount: number;
}

interface LessonCardProps {
  lesson: LessonSummary;
  onClick: (lessonId: string) => void;
  isCompleted?: boolean;
  progress?: number;
  isCached?: boolean;
  cachedAt?: number;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onClick,
  isCompleted = false,
  progress = 0,
  isCached = false,
  cachedAt,
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        },
        position: "relative",
        overflow: "visible",
      }}
    >
      <CardActionArea
        onClick={() => onClick(lesson.id)}
        sx={{ height: "100%" }}
      >
        <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: isCompleted || isCached ? 1 : 0,
            }}
          >
            {isCompleted && (
              <Chip
                label="Completed"
                color="success"
                size="small"
                sx={{ alignSelf: "flex-start" }}
              />
            )}
            {isCached && (
              <Tooltip
                title={
                  cachedAt
                    ? `Cached ${new Date(cachedAt).toLocaleString()}`
                    : "Cached for offline use"
                }
              >
                <Chip
                  label="Offline ready"
                  color="primary"
                  variant="outlined"
                  icon={<CloudDoneRoundedIcon fontSize="small" />}
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                />
              </Tooltip>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "baseline" },
                  gap: { xs: 0.5, sm: 2 },
                  mb: 1,
                }}
              >
                <Typography variant="h5" fontWeight={600} sx={{ minWidth: 0 }}>
                  {lesson.title}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "flex-start", md: "flex-end" },
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {lesson.vocabularyCount} words
              </Typography>

              {progress > 0 && (
                <Box sx={{ width: "100%", minWidth: 120 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Progress: {Math.round(progress)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
