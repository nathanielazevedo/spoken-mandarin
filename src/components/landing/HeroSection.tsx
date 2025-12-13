import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Stack,
} from "@mui/material";
import { PlayArrow as Play } from "@mui/icons-material";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <Box
      sx={{
        background:
          "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)",
        color: "white",
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
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        },
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "transparent",
          position: "relative",
          zIndex: 1,
          border: "none",
          boxShadow: "none",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexGrow: 1,
              }}
            >
              <Box
                component="img"
                src="/logo.svg"
                alt="Spoken Mandarin"
                sx={{ height: 48, width: "auto" }}
              />
            </Box>
            <Stack
              direction="row"
              spacing={3}
              sx={{ display: { xs: "none", md: "flex" }, mr: 4 }}
            >
              <Button
                color="inherit"
                onClick={() =>
                  document
                    .getElementById("why-choose")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Why Choose Us
              </Button>
              <Button
                color="inherit"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                How It Works
              </Button>
              <Button
                color="inherit"
                onClick={() =>
                  document
                    .getElementById("pricing")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Pricing
              </Button>
              <Button
                color="inherit"
                onClick={() =>
                  document
                    .getElementById("founders")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Our Team
              </Button>
            </Stack>
            <Button
              variant="contained"
              onClick={onGetStarted}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                },
                borderRadius: 2,
                px: 4,
                py: 1.2,
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
              }}
            >
              Get Started
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ py: { xs: 8, md: 14 }, position: "relative", zIndex: 1 }}
      >
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  display: "inline-block",
                  mb: 2,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                }}
              >
                LEARN CHINESE ONLINE
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4.5rem" },
                  fontWeight: 800,
                  mb: 3,
                  lineHeight: 1.1,
                  textShadow: "0 2px 20px rgba(0,0,0,0.1)",
                  color: "white",
                }}
              >
                Master Mandarin Through Conversation
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.7,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                Learn to speak Mandarin Chinese naturally with our interactive
                lessons, real-world vocabulary, and practical sentences. Start
                speaking from day one.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={onGetStarted}
                startIcon={<Play sx={{ fontSize: 20 }} />}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "grey.100",
                    transform: "translateY(-2px)",
                  },
                  borderRadius: 2,
                  px: 5,
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                }}
              >
                Start Learning Free
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
