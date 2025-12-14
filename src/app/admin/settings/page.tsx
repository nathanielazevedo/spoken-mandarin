"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function AdminSettingsPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Admin settings coming soon.
        </Typography>
      </Paper>
    </Box>
  );
}
