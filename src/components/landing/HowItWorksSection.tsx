import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
} from "@mui/material";

export function HowItWorksSection() {
  return (
    <Box
      id="how-it-works"
      sx={{
        bgcolor: "white",
        py: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          height: "80%",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

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
            OUR METHODOLOGY
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            How It Works
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
          >
            A proven three-step method for mastering Mandarin
          </Typography>
        </Box>

        <Stack spacing={4}>
          {/* Step 1 */}
          <Card
                elevation={0}
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                  border: 2,
                  borderColor: "transparent",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                  "&:hover": {
                    transform: "translateY(-12px) scale(1.02)",
                    boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                    borderColor: "#dc2626",
                    "& .step-number": {
                      transform: "scale(1.15) rotate(5deg)",
                    },
                  },
                }}
              >
                {/* Decorative circle */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    bgcolor: "#dc2626",
                    opacity: 0.05,
                  }}
                />

                <CardContent sx={{ p: 4, position: "relative" }}>
                  {/* Step Number Badge */}
                  <Box
                    className="step-number"
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: "#dc2626",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
                      transition: "all 0.3s ease",
                      mb: 3,
                    }}
                  >
                    1
                  </Box>

                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Drill Vocabulary
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Master essential Chinese words with pinyin, audio
                    pronunciation, and spaced repetition until they're second
                    nature.
                  </Typography>

                  <Box
                    sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#dc2626" }}
                    >
                      Build Strong Foundations
                    </Typography>
                  </Box>
                </CardContent>
          </Card>

          {/* Step 2 */}
          <Card
            elevation={0}
            sx={{
              width: "100%",
              background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                  border: 2,
                  borderColor: "transparent",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                  "&:hover": {
                    transform: "translateY(-12px) scale(1.02)",
                    boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                    borderColor: "#dc2626",
                    "& .step-number": {
                      transform: "scale(1.15) rotate(-5deg)",
                    },
                  },
                }}
              >
                {/* Decorative circle */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    bgcolor: "#dc2626",
                    opacity: 0.05,
                  }}
                />

                <CardContent sx={{ p: 4, position: "relative" }}>
                  {/* Step Number Badge */}
                  <Box
                    className="step-number"
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: "#dc2626",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
                      transition: "all 0.3s ease",
                      mb: 3,
                    }}
                  >
                    2
                  </Box>

                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Drill Sentences
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Practice real conversations and sentence structures
                    repeatedly until you can speak them fluently and naturally.
                  </Typography>

                  <Box
                    sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#dc2626" }}
                    >
                      Achieve Real Fluency
                    </Typography>
                  </Box>
                </CardContent>
          </Card>

          {/* Step 3 */}
          <Card
            elevation={0}
            sx={{
              width: "100%",
              background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                  border: 2,
                  borderColor: "transparent",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                  "&:hover": {
                    transform: "translateY(-12px) scale(1.02)",
                    boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                    borderColor: "#dc2626",
                    "& .step-number": {
                      transform: "scale(1.15) rotate(5deg)",
                    },
                  },
                }}
              >
                {/* Decorative circle */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    bgcolor: "#dc2626",
                    opacity: 0.05,
                  }}
                />

                <CardContent sx={{ p: 4, position: "relative" }}>
                  {/* Step Number Badge */}
                  <Box
                    className="step-number"
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: "#dc2626",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
                      transition: "all 0.3s ease",
                      mb: 3,
                    }}
                  >
                    3
                  </Box>

                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Prove Mastery
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Pass unforgiving exams that test your true understanding. No
                    advancement without demonstrating complete mastery.
                  </Typography>

                  <Box
                    sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#dc2626" }}
                    >
                      Earn True Mastery
                    </Typography>
                  </Box>
                </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
