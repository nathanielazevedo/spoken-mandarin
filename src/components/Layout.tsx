import React from "react";
import { Box } from "@mui/material";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <Box
    sx={{
      flexGrow: 1,
      minHeight: "100vh",
      bgcolor: "background.default",
      width: "100%",
      overflow: "hidden",
    }}
  >
    {children}
  </Box>
);
