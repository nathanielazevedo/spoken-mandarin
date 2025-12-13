import React from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import {
  Headphones as HeadphonesIcon,
  Speed as SpeedIcon,
  OfflineBolt as OfflineIcon,
  Psychology as PracticeIcon,
  Translate as TranslateIcon,
  Repeat as RepeatIcon,
} from "@mui/icons-material";

interface LandingPageProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: <HeadphonesIcon sx={{ fontSize: 40 }} />,
    title: "AI-Generated Audio",
    description:
      "Natural-sounding Mandarin pronunciation powered by OpenAI. Hear every word and sentence spoken clearly.",
  },
  {
    icon: <PracticeIcon sx={{ fontSize: 40 }} />,
    title: "Active Recall Practice",
    description:
      "Type pinyin from English prompts. Mistakes trigger spaced repetition to lock in your memory.",
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: "Timed Challenges",
    description:
      "Beat the clock to answer correctly. Time pressure builds quick recall for real conversations.",
  },
  {
    icon: <RepeatIcon sx={{ fontSize: 40 }} />,
    title: "Review Missed Words",
    description:
      "At the end of each session, drill the words you got wrong until you master them.",
  },
  {
    icon: <TranslateIcon sx={{ fontSize: 40 }} />,
    title: "Vocabulary + Sentences",
    description:
      "Learn individual words, then see them in context with full sentence practice.",
  },
  {
    icon: <OfflineIcon sx={{ fontSize: 40 }} />,
    title: "Works Offline",
    description:
      "Cache lessons for offline practice. Learn on the subway, plane, or anywhere without wifi.",
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 10 },
            textAlign: "center",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
              fontWeight: 800,
              mb: 2,
              color: "primary.main",
            }}
          >
            学习中文
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              fontWeight: 600,
              mb: 3,
              color: "text.primary",
            }}
          >
            Learn Mandarin the Smart Way
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 600,
              mx: "auto",
              mb: 5,
              color: "text.secondary",
              fontSize: { xs: "1rem", md: "1.25rem" },
              lineHeight: 1.6,
            }}
          >
            Master pinyin with AI-powered audio, timed practice sessions, and
            smart repetition. Build real fluency through active recall.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={onGetStarted}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 3,
                textTransform: "none",
              }}
            >
              Start Learning Free
            </Button>
          </Stack>
        </Box>

        {/* Demo Preview */}
        <Box
          sx={{
            mb: { xs: 8, md: 12 },
            mx: "auto",
            maxWidth: 800,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: 4,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                }}
              />
            </Stack>
          </Box>
          <Box sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
            >
              What does "hello" mean?
            </Typography>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontWeight: 700,
                color: "primary.main",
                fontFamily: "inherit",
              }}
            >
              nǐ hǎo
            </Typography>
            <Box
              sx={{
                display: "inline-block",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "action.hover",
                border: 2,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Type your answer...
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ mt: 3 }}
            >
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "warning.main",
                  color: "warning.contrastText",
                  fontWeight: 600,
                }}
              >
                ⏱️ 12s
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "action.selected",
                  fontWeight: 600,
                }}
              >
                3 / 10
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Features Grid */}
        <Box sx={{ pb: { xs: 8, md: 12 } }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
            }}
          >
            Everything you need to learn Mandarin
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      mb: 2,
                      color: "primary.main",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            py: { xs: 6, md: 8 },
            textAlign: "center",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            Ready to start learning?
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, color: "text.secondary", maxWidth: 500, mx: "auto" }}
          >
            Jump in and start practicing Mandarin today. No account required.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onGetStarted}
            sx={{
              px: 5,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: 3,
              textTransform: "none",
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Built for learners, by learners 🇨🇳
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
