"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { chatGPTLightTheme, chatGPTDarkTheme } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Export for components that need to check context availability
export { ThemeContext };

const THEME_STORAGE_KEY = "theme-mode";

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeMode | null;
    if (savedMode && (savedMode === "light" || savedMode === "dark")) {
      setModeState(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setModeState(prefersDark ? "dark" : "light");
    }
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const theme = useMemo(() => {
    return mode === "light" ? chatGPTLightTheme : chatGPTDarkTheme;
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
    }),
    [mode]
  );

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <MuiThemeProvider theme={chatGPTDarkTheme}>{children}</MuiThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
