import { createTheme } from '@mui/material/styles';

// ChatGPT-inspired light theme
export const chatGPTLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff', // White background
      paper: '#f7f7f8', // Light gray paper
    },
    surface: {
      main: '#ececf1', // Surface elements
    },
    text: {
      primary: '#0d0d0d', // Near black text
      secondary: '#6e6e80', // Muted text
    },
    divider: '#e5e5e5',
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#0d0d0d',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#0d0d0d',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#0d0d0d',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#0d0d0d',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#0d0d0d',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#0d0d0d',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#0d0d0d',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#6e6e80',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          margin: 0,
          padding: 0,
          width: '100%',
          minHeight: '100vh',
        },
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#c5c5d2 #ffffff',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#ffffff',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c5c5d2',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8b3',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f7f7f8',
          borderBottom: '1px solid #e5e5e5',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f7f7f8',
          borderRight: '1px solid #e5e5e5',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        },
        outlined: {
          borderColor: '#e5e5e5',
          '&:hover': {
            borderColor: '#c5c5d2',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e5e5e5',
            },
            '&:hover fieldset': {
              borderColor: '#c5c5d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#dc2626',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#6e6e80',
            '&.Mui-focused': {
              color: '#dc2626',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#0d0d0d',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e5e5e5',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#6e6e80',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            color: '#0d0d0d',
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#0d0d0d',
        },
        secondary: {
          color: '#6e6e80',
        },
      },
    },
  },
});

// ChatGPT-inspired dark theme
export const chatGPTDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#171717', // Very dark gray background
      paper: '#202123', // Card/paper background
    },
    surface: {
      main: '#2d2d30', // Surface elements
    },
    text: {
      primary: '#ececf1', // Light gray text
      secondary: '#9ca3af', // Muted text
    },
    divider: '#4d4d4f',
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#ececf1',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ececf1',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ececf1',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ececf1',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#ececf1',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ececf1',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#ececf1',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#9ca3af',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          margin: 0,
          padding: 0,
          width: '100%',
          minHeight: '100vh',
        },
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#4d4d4f #171717',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#171717',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#4d4d4f',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#6b7280',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#202123',
          borderBottom: '1px solid #4d4d4f',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#171717',
          borderRight: '1px solid #4d4d4f',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#202123',
          border: '1px solid #4d4d4f',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        },
        outlined: {
          borderColor: '#4d4d4f',
          '&:hover': {
            borderColor: '#6b7280',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#171717',
            '& fieldset': {
              borderColor: '#4d4d4f',
            },
            '&:hover fieldset': {
              borderColor: '#6b7280',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#dc2626',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#9ca3af',
            '&.Mui-focused': {
              color: '#dc2626',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#ececf1',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#4d4d4f',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#9ca3af',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#ececf1',
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#ececf1',
        },
        secondary: {
          color: '#9ca3af',
        },
      },
    },
  },
});

// Extend the theme interface to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      main: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      main: string;
    };
  }
}