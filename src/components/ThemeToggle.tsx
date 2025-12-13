"use client";

import React, { useContext } from "react";
import { IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { ThemeContext } from "../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const context = useContext(ThemeContext);

  // If context isn't available yet (SSR or not mounted), render nothing
  if (!context) {
    return null;
  }

  const { mode, toggleTheme } = context;

  return (
    <Tooltip
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <IconButton
        onClick={toggleTheme}
        size="medium"
        sx={{
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
        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};
