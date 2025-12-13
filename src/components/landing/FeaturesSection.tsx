import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
} from "@mui/material";

export function FeaturesSection() {
  return (
    <Box
      id="why-choose"
      sx={{
        bgcolor: "grey.50",
        py: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <Typography
            variant="overline"
            sx={{
              color: "#dc2626",
              fontWeight: 700,
              letterSpacing: 2,
              mb: 2,
              display: "block",
            }}
          >
            POWERFUL FEATURES
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Why Choose Spoken Mandarin?
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: "auto", lineHeight: 1.6 }}
          >
            A revolutionary approach to language learning backed by
            neuroscience, powered by AI, and built for real results
          </Typography>
        </Box>

        <Stack spacing={4}>
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
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-12px)",
                boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                borderColor: "#dc2626",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "#dc2626",
                opacity: 0.05,
              }}
            />
            <CardContent sx={{ p: 4, position: "relative" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Mastery-Based Learning
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.8, mb: 2 }}
              >
                You can't move forward until you've truly mastered the material.
                No skipping ahead means solid foundations and real fluency.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, mt: 3, color: "#dc2626" }}
              >
                Guaranteed Progress
              </Typography>
            </CardContent>
          </Card>

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
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-12px)",
                boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                borderColor: "#dc2626",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "#dc2626",
                opacity: 0.05,
              }}
            />
            <CardContent sx={{ p: 4, position: "relative" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, mb: 2 }}
              >
                AI-Powered Learning
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.8, mb: 2 }}
              >
                Advanced AI adapts to your learning style, provides instant
                feedback, and creates personalized practice sessions for maximum
                retention.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, mt: 3, color: "#dc2626" }}
              >
                Smart & Adaptive
              </Typography>
            </CardContent>
          </Card>

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
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-12px)",
                boxShadow: "0 20px 40px rgba(220,38,38,0.15)",
                borderColor: "#dc2626",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "#dc2626",
                opacity: 0.05,
              }}
            />
            <CardContent sx={{ p: 4, position: "relative" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Built for Speed
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.8, mb: 2 }}
              >
                Created by a founder who needed to learn Mandarin fast. Every
                lesson is optimized for rapid acquisition without sacrificing
                depth.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, mt: 3, color: "#dc2626" }}
              >
                Fast & Effective
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
