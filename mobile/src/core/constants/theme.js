// Theme matching the VSCMS ERP mobile UI design
export const COLORS = {
  primary: '#1d61e7',       // Electric blue matching UI design image
  primaryLight: '#3b82f6',  // Blue-500
  primaryDark: '#1e40af',   // Blue-800
  secondary: '#ef4444',     // Red accent
  secondaryLight: '#f87171',
  secondaryDark: '#dc2626',
  background: '#f8fafc',    // Clean slate-50
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  surfaceDark: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
  text: '#0f172a',          // Slate-900
  textSecondary: '#64748b', // Slate-500
  textMuted: '#94a3b8',     // Slate-400
  textLight: '#ffffff',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  disabled: '#94a3b8',
  overlay: 'rgba(0, 0, 0, 0.5)',
  ink: '#0f172a',
  paper: '#ffffff',
  danger: '#ef4444',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 6,
  round: 999,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  title: 28,
  hero: 34,
  display: 40,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  // Brutal shadow matching website
  brutal: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
};

// Website color palette for charts
export const CHART_COLORS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#94a3b8'];
