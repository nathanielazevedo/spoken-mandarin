"use client";

import React from "react";
import {
  AppBar,
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

// Helper to convert number to Roman numeral
const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let remaining = num;
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
};

export interface TopNavProps {
  onCreateLesson?: () => void;
  isCreatingLesson?: boolean;
  breadcrumb?: {
    program?: string;
    level?: { order: number; name: string };
    unit?: { order: number; name: string };
    lesson?: string;
  };
}

export const TopNav: React.FC<TopNavProps> = ({
  onCreateLesson,
  isCreatingLesson = false,
  breadcrumb,
}) => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {breadcrumb ? (
          <Breadcrumbs
            separator={
              <NavigateNextIcon
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
            }
            sx={{ "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
          >
            {breadcrumb.program && (
              <Link
                component="button"
                underline="hover"
                onClick={handleLogoClick}
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "0.95rem",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {breadcrumb.program}
              </Link>
            )}
            {breadcrumb.level && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.95rem",
                }}
              >
                Level {toRoman(breadcrumb.level.order)}
              </Typography>
            )}
            {breadcrumb.unit && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.95rem",
                }}
              >
                Unit {breadcrumb.unit.order}
              </Typography>
            )}
            {breadcrumb.lesson && (
              <Typography
                sx={{
                  color: "text.primary",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                }}
              >
                {breadcrumb.lesson}
              </Typography>
            )}
          </Breadcrumbs>
        ) : (
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
        )}
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
