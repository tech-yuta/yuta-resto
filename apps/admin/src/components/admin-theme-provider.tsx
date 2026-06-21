'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PropsWithChildren } from 'react';

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#365314', light: '#b7ef5b', dark: '#1f3d0d' },
        background: { default: '#f7f8f4', paper: '#ffffff' },
        text: { primary: '#16211d', secondary: '#627066' },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.035em' },
    h6: { fontWeight: 750 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { border: '1px solid #e1e7de', boxShadow: '0 8px 28px rgb(22 33 29 / 5%)' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, fontWeight: 700, textTransform: 'none' } } },
  },
});

export function AdminThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
