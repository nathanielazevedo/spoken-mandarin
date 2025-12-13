"use client";

import React from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export interface TopNavProps {
  onCreateLesson?: () => void;
  isCreatingLesson?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onCreateLesson,
  isCreatingLesson = false,
}) => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          onClick={handleLogoClick}
          sx={{
            fontWeight: 700,
            cursor: "pointer",
            color: "text.primary",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          Spoken Mandarin
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {onCreateLesson && (
            <Tooltip title="Create lesson">
              <IconButton
                onClick={onCreateLesson}
                disabled={isCreatingLesson}
                size="medium"
                sx={{
                  color: "text.primary",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(32, 33, 35, 0.6)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "rgba(255, 255, 255, 0.4)"
                      : "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgba(32, 33, 35, 0.8)",
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
