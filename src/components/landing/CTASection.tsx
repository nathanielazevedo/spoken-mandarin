import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <Box
      sx={{
        bgcolor: "grey.900",
        color: "white",
        py: 12,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(220,38,38,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(249,115,22,0.2) 0%, transparent 50%)",
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: "white" }}>
            Ready to Start Speaking Mandarin?
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 5, color: "grey.300", maxWidth: 600, mx: "auto" }}
          >
            Join thousands of learners mastering Mandarin Chinese through our
            proven method. Start your journey today, completely free.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={onGetStarted}
              startIcon={<TrendingUp sx={{ fontSize: 20 }} />}
              sx={{
                bgcolor: "primary.main",
                "&:hover": {
                  bgcolor: "primary.dark",
                  transform: "translateY(-2px)",
                },
                borderRadius: 2,
                px: 5,
                py: 2,
                fontSize: "1.1rem",
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(220,38,38,0.3)",
                transition: "all 0.3s ease",
              }}
            >
              Begin Your Journey
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                },
                borderRadius: 2,
                px: 5,
                py: 2,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderWidth: 2,
                transition: "all 0.3s ease",
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
