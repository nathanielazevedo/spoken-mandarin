import { Box, Container, Typography, Grid } from "@mui/material";

export function StatsSection() {
  return (
    <Box
      sx={{
        bgcolor: "white",
        py: 6,
        borderBottom: 1,
        borderColor: "grey.100",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-evenly">
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h3"
                color="primary"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                500+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Vocabulary Words
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h3"
                color="primary"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                100+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Practice Sentences
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h3"
                color="primary"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                4.9★
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Average Rating
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
