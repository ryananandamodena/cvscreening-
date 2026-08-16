export const Colors = {
  // Humaniq brand blue (matches assets/images/icon.png and the web app's brand-600 token) —
  // was '#38529B' (a muted navy left over from an earlier "SunFish" rebrand).
  primary: '#0B4DDB',
  primaryDark: '#083AA8',
  primaryLight: '#3B82F6',
  primaryBg: '#EAF1FE',
  // Humaniq brand teal — the mark's right-hand gradient, used as a secondary accent.
  accentTeal: '#06B6D4',
  accentMint: '#2DD4BF',

  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  info: '#3b82f6',
  infoBg: '#dbeafe',

  white: '#ffffff',
  background: '#F4F6F9',
  card: '#ffffff',
  cardBorder: '#E8ECF0',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverted: '#ffffff',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F3F4F6',

  overlay: 'rgba(0,0,0,0.5)',

  sectionBg: '#EAF1FE',
  tabActive: '#0B4DDB',
  tabInactive: '#9CA3AF',
  // The FAB is the clock-in shortcut — teal instead of primary blue so it stands out from the
  // tab bar's blue active state, echoing the mark's two-tone (blue pillar / teal pillar) motif.
  fabColor: '#06B6D4',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
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

export const Gradients = {
  primary: ['#0B4DDB', '#3B82F6'] as const,
  success: ['#10b981', '#34d399'] as const,
  warning: ['#f59e0b', '#fbbf24'] as const,
  danger: ['#ef4444', '#f87171'] as const,
  info: ['#3b82f6', '#60a5fa'] as const,
  // Soft tinted gradients for cards and icons
  softOrange: ['#FFF3E0', '#FFE0B2'] as const,
  softPink: ['#FCE4EC', '#F8BBD0'] as const,
  softGreen: ['#E8F5E9', '#C8E6C9'] as const,
  softBlue: ['#E3F2FD', '#BBDEFB'] as const,
  softPurple: ['#F3E5F5', '#E1BEE7'] as const,
  softTeal: ['#E0F2F1', '#B2DFDB'] as const,
  meshLight: ['#ffffff', '#f8fafc', '#f1f5f9'] as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#0B4DDB', // Tinted shadow for elegance
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B4DDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B4DDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};
