import React from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import {
  School as SchoolIcon,
  CheckCircle as CompletedIcon,
} from "@mui/icons-material";
import type { Lesson } from "../types/lesson";

interface LessonCardProps {
  lesson: Lesson;
  onClick: (lessonId: string) => void;
  isCompleted?: boolean;
  progress?: number;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onClick,
  isCompleted = false,
  progress = 0,
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
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "stretch",
          p: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: "auto", sm: 120 },
            minHeight: { xs: 80, sm: "auto" },
            bgcolor: "rgba(16, 163, 127, 0.1)",
            borderRadius: { xs: "8px 8px 0 0", sm: "8px 0 0 8px" },
          }}
        >
          <SchoolIcon
            sx={{ fontSize: { xs: 32, sm: 40 }, color: "primary.main" }}
          />
          {isCompleted && (
            <CompletedIcon
              sx={{
                color: "success.main",
                fontSize: 20,
                position: "absolute",
                top: 8,
                right: 8,
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: "100%" }}>
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
                <Typography
                  variant="h6"
                  sx={{
                    color: "text.secondary",
                    fontSize: "1rem",
                    fontWeight: 400,
                    flexShrink: 0,
                  }}
                >
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
                {lesson.vocabulary.length} words
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
