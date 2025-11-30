"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { chatGPTDarkTheme } from "../src/theme";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={chatGPTDarkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
