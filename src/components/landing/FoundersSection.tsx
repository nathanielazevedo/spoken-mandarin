import { Box, Container, Typography, Grid, Card, Stack } from "@mui/material";
import {
  EmojiEvents as Trophy,
  MenuBook as BookOpen,
  Psychology as Brain,
  Bolt as Zap,
} from "@mui/icons-material";

export function FoundersSection() {
  return (
    <Box id="founders" sx={{ bgcolor: "grey.50", py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: 2,
              mb: 1,
              display: "block",
            }}
          >
            THE TEAM
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Meet Our Founders
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 650, mx: "auto" }}
          >
            Experts in technology and learning science working together to
            revolutionize language education
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {/* Nate Azevedo */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                border: 1,
                borderColor: "grey.200",
                borderRadius: 3,
                p: 3,
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 20px rgba(220,38,38,0.12)",
                  borderColor: "error.main",
                },
              }}
            >
              <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                {/* Avatar */}
                <Box
                  component="img"
                  src="/nate_headshot.jpeg"
                  alt="Nate Azevedo"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: 3,
                    borderColor: "error.light",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(220,38,38,0.15)",
                    objectFit: "cover",
                  }}
                />

                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Nate Azevedo
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.main"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      Software Engineer • Co-Founder
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    With over 10 years of experience in building educational
                    technology platforms, Alex brings technical expertise and a
                    passion for creating intuitive learning experiences.
                  </Typography>

                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Trophy sx={{ fontSize: 16, color: "#dc2626" }} />
                      <Typography variant="caption" color="text.secondary">
                        <strong>10+ years</strong> in EdTech
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Zap sx={{ fontSize: 16, color: "#dc2626" }} />
                      <Typography variant="caption" color="text.secondary">
                        Needed to learn Mandarin fast
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Liyuan Sun */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                border: 1,
                borderColor: "grey.200",
                borderRadius: 3,
                p: 3,
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 20px rgba(220,38,38,0.12)",
                  borderColor: "#dc2626",
                },
              }}
            >
              <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                {/* Avatar */}
                <Box
                  component="img"
                  src="/liyuan_headshot.webp"
                  alt="Dr. Liyuan Sun"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: 3,
                    borderColor: "error.light",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(220,38,38,0.15)",
                    objectFit: "cover",
                  }}
                />

                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Dr. Liyuan Sun
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5, color: "#dc2626" }}
                    >
                      Neuroscientist • Co-Founder
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    Dr. Sun's research in cognitive neuroscience and language
                    acquisition informs our evidence-based curriculum designed
                    for optimal retention and real-world application.
                  </Typography>

                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Brain sx={{ fontSize: 16, color: "#dc2626" }} />
                      <Typography variant="caption" color="text.secondary">
                        <strong>Yale University</strong> Research
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BookOpen sx={{ fontSize: 16, color: "#dc2626" }} />
                      <Typography variant="caption" color="text.secondary">
                        Cognitive neuroscience
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
