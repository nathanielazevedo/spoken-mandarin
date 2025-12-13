import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Button,
  Stack,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <Box
      id="pricing"
      sx={{
        py: 12,
        position: "relative",
        overflow: "hidden",
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "url(/hanziBackgroundDark.svg)"
            : "url(/haziBackground.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: 2,
              mb: 2,
              display: "block",
            }}
          >
            PRICING
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Choose Your Plan
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
          >
            Start free and upgrade when you're ready to accelerate your Mandarin
            mastery
          </Typography>
        </Box>

        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
        >
          {/* Free Plan */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                background: "linear-gradient(135deg, #fff 0%, #f9fafb 100%)",
                border: 2,
                borderColor: "grey.200",
                borderRadius: 4,
                p: 4,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s ease",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  borderColor: "grey.400",
                },
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  Free
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, minHeight: 48 }}
                >
                  Perfect for getting started with Mandarin basics
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, display: "inline" }}
                  >
                    $0
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ display: "inline", ml: 1 }}
                  >
                    / forever
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "#059669",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2">
                      Access to Lesson 1: Greetings
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "#059669",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2">
                      Basic vocabulary drills
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "#059669",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2">Audio pronunciation</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "#059669",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2">Progress tracking</Typography>
                  </Box>
                </Stack>
              </Box>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={onGetStarted}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 700,
                  borderWidth: 2,
                  borderColor: "grey.300",
                  color: "text.primary",
                  "&:hover": {
                    borderWidth: 2,
                    borderColor: "grey.400",
                    bgcolor: "grey.50",
                  },
                }}
              >
                Get Started Free
              </Button>
            </Card>
          </Grid>

          {/* Premium Plan - Featured */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                border: 2,
                borderColor: "#dc2626",
                borderRadius: 4,
                p: 4,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s ease",
                display: "flex",
                flexDirection: "column",
                color: "white",
                "&:hover": {
                  transform: "translateY(-12px) scale(1.02)",
                  boxShadow: "0 20px 40px rgba(220,38,38,0.3)",
                },
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 1, color: "white" }}
                >
                  Premium
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, minHeight: 48, color: "white" }}
                >
                  Complete access to master Mandarin at your own pace
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, display: "inline", color: "white" }}
                  >
                    $29
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ display: "inline", ml: 1, color: "white" }}
                  >
                    / month
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "white" }}>
                      All 6 lessons unlocked
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "white" }}>
                      AI-powered personalized learning
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "white" }}>
                      Unlimited practice sessions
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "white" }}>
                      Advanced progress analytics
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "white" }}>
                      Priority support
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 700,
                  bgcolor: "white",
                  color: "#dc2626",
                  "&:hover": {
                    bgcolor: "grey.100",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Start Premium
              </Button>
            </Card>
          </Grid>
        </Grid>

        {/* Trust badges */}
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 20, color: "#059669" }} />
              <Typography variant="body2" color="text.secondary">
                30-day money-back guarantee
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 20, color: "#059669" }} />
              <Typography variant="body2" color="text.secondary">
                Cancel anytime
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 20, color: "#059669" }} />
              <Typography variant="body2" color="text.secondary">
                Secure payment
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
