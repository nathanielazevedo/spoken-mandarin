import React from "react";
import { Box } from "@mui/material";
import { lessons } from "../data";
import { LessonCard } from "./LessonCard";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  return (
    <Box
      sx={{
        pt: { xs: 2, sm: 3 },
        pb: 4,
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2, sm: 3 },
          width: "100%",
        }}
      >
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onClick={handleLessonClick}
            isCompleted={false}
            progress={0}
          />
        ))}
      </Box>
    </Box>
  );
};
