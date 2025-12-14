import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Divider,
} from "@mui/material";

export function FooterSection() {
  return (
    <Box
      sx={{
        bgcolor: "grey.900",
        color: "white",
        py: 8,
        borderTop: 1,
        borderColor: "grey.800",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
            >
              <Box
                component="img"
                src="/logo.svg"
                alt="Spoken Mandarin"
                sx={{ height: 32 }}
              />
            </Box>
            <Typography
              variant="body2"
              color="grey.400"
              sx={{ lineHeight: 1.7 }}
            >
              The most effective way to learn Mandarin Chinese through practical
              conversation and real-world scenarios.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Product
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Lessons
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Pricing
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Features
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    About
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Blog
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Careers
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Resources
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Help Center
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Community
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Contact
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Legal
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Privacy
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    Terms
                  </Typography>
                  <Typography
                    variant="body2"
                    color="grey.400"
                    sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                  >
                    License
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: "grey.800" }} />
        <Typography variant="body2" color="grey.500" align="center">
          © 2025 Spoken Mandarin. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
