export const Colors = {
  primary: '#6366f1', // Indigo 500 (Vibrant)
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  primaryBg: '#e0e7ff',

  success: '#10b981', // Emerald 500
  successBg: '#d1fae5',
  warning: '#f59e0b', // Amber 500
  warningBg: '#fef3c7',
  danger: '#ef4444', // Red 500
  dangerBg: '#fee2e2',
  info: '#3b82f6', // Blue 500
  infoBg: '#dbeafe',

  white: '#ffffff',
  background: '#f1f5f9', // Slate 100 for better contrast against white cards
  card: '#ffffff',
  cardBorder: '#e2e8f0',

  text: '#0f172a', // Slate 900
  textSecondary: '#64748b', // Slate 500
  textTertiary: '#94a3b8', // Slate 400
  textInverted: '#ffffff',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#f1f5f9',

  overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};
