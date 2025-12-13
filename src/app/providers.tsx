"use client";

import { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "../context/ThemeContext";
import { ServiceWorkerRegistration } from "./service-worker-registration";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <ServiceWorkerRegistration />
      {children}
    </ThemeProvider>
  );
}
