"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { chatGPTDarkTheme } from "../src/theme";
import { ServiceWorkerRegistration } from "./service-worker-registration";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={chatGPTDarkTheme}>
      <CssBaseline />
      <ServiceWorkerRegistration />
      {children}
    </ThemeProvider>
  );
}
