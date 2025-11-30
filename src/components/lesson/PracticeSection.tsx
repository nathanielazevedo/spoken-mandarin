import React, { type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

export interface SectionButtonConfig {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface PracticeSectionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  listenButton: SectionButtonConfig;
  practiceButton: SectionButtonConfig;
  addButton?: SectionButtonConfig;
  accordionTitle: string;
  accordionDescription?: string;
  infoMessage?: string | null;
  extraActions?: ReactNode;
  children: ReactNode;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  icon,
  title,
  subtitle,
  listenButton,
  practiceButton,
  addButton,
  accordionTitle,
  accordionDescription,
  infoMessage,
  extraActions,
  children,
}) => (
  <Paper
    sx={{
      mb: 3,
      p: { xs: 2.5, sm: 3 },
      borderRadius: 3,
      backgroundColor: (theme) => theme.palette.background.paper,
      border: "1px solid",
      borderColor: (theme) => theme.palette.divider,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1,
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {icon}
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {extraActions}
        <Button
          variant="outlined"
          startIcon={listenButton.icon}
          onClick={listenButton.onClick}
          disabled={listenButton.disabled}
        >
          {listenButton.label}
        </Button>
        <Button
          variant="contained"
          startIcon={practiceButton.icon}
          onClick={practiceButton.onClick}
          disabled={practiceButton.disabled}
        >
          {practiceButton.label}
        </Button>
      </Stack>
    </Box>
    {addButton && (
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={addButton.icon}
          onClick={addButton.onClick}
          disabled={addButton.disabled}
        >
          {addButton.label}
        </Button>
      </Box>
    )}
    {infoMessage && (
      <Alert severity="info" sx={{ mt: 2 }}>
        {infoMessage}
      </Alert>
    )}
    <Accordion
      sx={{
        mt: 2,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
      >
        <Box>
          <Typography fontWeight={600}>{accordionTitle}</Typography>
          {accordionDescription && (
            <Typography variant="body2" color="text.secondary">
              {accordionDescription}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  </Paper>
);
