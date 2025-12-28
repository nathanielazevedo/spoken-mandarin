"use client";

import React, { useState, useContext } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";

// Helper to convert number to Roman numeral
const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let remaining = num;
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
};

export interface TopNavProps {
  onCreateLesson?: () => void;
  isCreatingLesson?: boolean;
  breadcrumb?: {
    program?: string;
    level?: { id: string; order: number; name: string };
    unit?: { id: string; order: number; name: string };
    lesson?: string;
  };
}

export const TopNav: React.FC<TopNavProps> = ({
  onCreateLesson,
  isCreatingLesson = false,
  breadcrumb,
}) => {
  const router = useRouter();
  const { user, signOut, isLoading, isAdmin, role } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const themeContext = useContext(ThemeContext);

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleMenuClose();
    router.push("/");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleBackToCurriculum = () => {
    router.push("/curriculum");
  };

  const handleBack = () => {
    if (breadcrumb?.lesson && breadcrumb?.unit && breadcrumb?.level) {
      // From lesson, go back to unit
      router.push(
        `/curriculum/level/${breadcrumb.level.id}/unit/${breadcrumb.unit.id}`
      );
    } else if (breadcrumb?.unit && breadcrumb?.level) {
      // From unit, go back to level
      router.push(`/curriculum/level/${breadcrumb.level.id}`);
    } else if (breadcrumb?.level) {
      // From level, go back to curriculum
      router.push("/curriculum");
    } else {
      // Default to curriculum
      router.push("/curriculum");
    }
  };

  const handleToggleTheme = () => {
    themeContext?.toggleTheme();
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {breadcrumb ? (
          <>
            {/* Mobile: Show back button */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconButton
                onClick={handleBack}
                size="small"
                sx={{
                  color: "text.primary",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "0.95rem",
                }}
              >
                {breadcrumb.lesson}
              </Typography>
            </Box>

            {/* Desktop: Show full breadcrumbs */}
            <Breadcrumbs
              separator={
                <NavigateNextIcon
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
              }
              sx={{
                display: { xs: "none", md: "flex" },
                "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
              }}
            >
              {breadcrumb.program && (
                <Link
                  component="button"
                  underline="hover"
                  onClick={handleLogoClick}
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    fontSize: "0.95rem",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {breadcrumb.program}
                </Link>
              )}
              {breadcrumb.level && (
                <Link
                  component="button"
                  underline="hover"
                  onClick={() =>
                    router.push(`/curriculum/level/${breadcrumb.level!.id}`)
                  }
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.95rem",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Level {toRoman(breadcrumb.level.order)}
                </Link>
              )}
              {breadcrumb.unit && breadcrumb.level && (
                <Link
                  component="button"
                  underline="hover"
                  onClick={() =>
                    router.push(
                      `/curriculum/level/${breadcrumb.level!.id}/unit/${
                        breadcrumb.unit!.id
                      }`
                    )
                  }
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.95rem",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Unit {breadcrumb.unit.order}
                </Link>
              )}
              {breadcrumb.lesson && (
                <Typography
                  sx={{
                    color: "text.primary",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                  }}
                >
                  {breadcrumb.lesson}
                </Typography>
              )}
            </Breadcrumbs>
          </>
        ) : (
          <Typography
            variant="h6"
            component="div"
            onClick={handleLogoClick}
            sx={{
              fontWeight: 700,
              cursor: "pointer",
              color: "text.primary",
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            Spoken Mandarin
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {onCreateLesson && (
            <Tooltip title="Create lesson">
              <IconButton
                onClick={onCreateLesson}
                disabled={isCreatingLesson}
                size="medium"
                sx={{
                  color: "text.primary",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(32, 33, 35, 0.6)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "rgba(255, 255, 255, 0.4)"
                      : "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgba(32, 33, 35, 0.8)",
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Tooltip title="Account">
                    <IconButton
                      onClick={handleMenuOpen}
                      size="small"
                      sx={{ ml: 0.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "primary.main",
                          fontSize: "0.875rem",
                        }}
                      >
                        {user.email?.[0].toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <MenuItem disabled>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        {isAdmin && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            Admin
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem
                        onClick={() => {
                          handleMenuClose();
                          router.push("/admin");
                        }}
                      >
                        Admin Dashboard
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={handleToggleTheme}>
                      <ListItemIcon>
                        {themeContext?.mode === "dark" ? (
                          <LightModeIcon fontSize="small" />
                        ) : (
                          <DarkModeIcon fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {themeContext?.mode === "dark"
                          ? "Light Mode"
                          : "Dark Mode"}
                      </ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <Button
                    onClick={handleLogin}
                    variant="outlined"
                    size="small"
                    sx={{
                      ml: 1,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
