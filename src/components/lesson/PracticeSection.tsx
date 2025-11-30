import React, { Children, type ReactNode } from "react";
import {
  Alert,
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { IconButtonProps } from "@mui/material/IconButton";

export interface SectionButtonConfig {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: IconButtonProps["color"];
  ariaLabel?: string;
}

export interface PracticeSectionProps {
  title: string;
  subtitle: string;
  listenButton: SectionButtonConfig;
  practiceButton: SectionButtonConfig;
  addButton?: SectionButtonConfig;
  infoMessage?: string | null;
  extraActions?: ReactNode;
  listenControls?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  title,
  subtitle,
  listenButton,
  practiceButton,
  addButton,
  infoMessage,
  extraActions,
  listenControls,
  defaultExpanded = false,
  children,
}) => {
  const extraActionItems = extraActions ? Children.toArray(extraActions) : [];
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const renderIconButton = (config: SectionButtonConfig) => (
    <Tooltip title={config.label}>
      <span
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <IconButton
          color={config.color ?? "primary"}
          onClick={config.onClick}
          disabled={config.disabled}
          aria-label={config.ariaLabel ?? config.label}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            width: 48,
            height: 48,
          }}
        >
          {config.icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        mb: 3,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{
          mb: 1,
          width: "100%",
          cursor: "pointer",
        }}
        onClick={toggleExpanded}
        onKeyDown={handleHeaderKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
      >
        <Box
          sx={{
            cursor: "pointer",
            width: "100%",
            outline: "none",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          flexWrap={{ sm: "wrap" }}
          sx={{
            width: "100%",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            alignItems: { xs: "stretch", sm: "center" },
            cursor: "default",
          }}
        >
          {addButton ? renderIconButton(addButton) : null}
          {extraActionItems.map((action, index) => (
            <Box
              key={`extra-action-${index}`}
              sx={{
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                cursor: "default",
              }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {action}
            </Box>
          ))}
          {listenControls ? (
            <Box
              sx={{
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {listenControls}
            </Box>
          ) : null}
          {renderIconButton(listenButton)}
          {renderIconButton(practiceButton)}
        </Stack>
      </Stack>
      {infoMessage && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {infoMessage}
        </Alert>
      )}
      <Collapse in={isExpanded} sx={{ mt: 2 }}>
        {children}
      </Collapse>
    </Paper>
  );
};
