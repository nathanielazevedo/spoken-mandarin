import React from "react";
import { Box, Paper, Skeleton, Stack } from "@mui/material";

export const LessonPageSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        pt: { xs: 2, sm: 3 },
        pb: 4,
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        width: "100%",
      }}
    >
      {/* Hero skeleton */}
      <Paper
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={250} height={40} />
          <Skeleton variant="text" width={180} height={24} />
        </Stack>
      </Paper>

      {/* Vocabulary section skeleton */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={60}
            sx={{ mb: 1, borderRadius: 2 }}
          />
        ))}
      </Paper>

      {/* Sentence section skeleton */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={80}
            sx={{ mb: 1, borderRadius: 2 }}
          />
        ))}
      </Paper>
    </Box>
  );
};
