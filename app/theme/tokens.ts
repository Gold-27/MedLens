// Design Tokens for MedLens
// Generated from design-tokens.css

// Color Tokens
export const colors = {
  // Primary
  primary: '#4077f1',
  onPrimary: '#ffffff',
  primaryContainer: '#d0ddfb',
  onPrimaryContainer: '#0b348e',
  
  // Secondary
  secondary: '#485f85',
  onSecondary: '#ffffff',
  secondaryContainer: '#e0e4eb',
  onSecondaryContainer: '#3a4c6a',
  
  // Tertiary
  tertiary: '#73428a',
  onTertiary: '#ffffff',
  tertiaryContainer: '#e9ddee',
  onTertiaryContainer: '#563267',
  
  // Surface
  surface: '#fafafa',
  onSurface: '#18181b',
  surfaceVariant: '#e4e4e7',
  onSurfaceVariant: '#48484f',
  surfaceContainerHighest: '#e4e4e7',
  surfaceContainerHigh: '#e9e9ec',
  surfaceContainer: '#efeff1',
  surfaceContainerLow: '#f4f4f5',
  surfaceContainerLowest: '#ffffff',
  
  // Background
  background: '#fafafa',
  onBackground: '#18181b',
  
  // Outline
  outline: '#7a7a85',
  outlineVariant: '#cacace',
  
  // Error
  error: '#ef4444',
  onError: '#ffffff',
  errorContainer: '#fbd0d0',
  onErrorContainer: '#601b1b',
  
  // Success
  success: '#10b981',
  onSuccess: '#ffffff',
  successContainer: '#d0fbed',
  onSuccessContainer: '#0c8d62',
  
  // Accent
  accent: '#ec7b18',
  onAccent: '#ffffff',
  accentContainer: '#fbe4d0',
  onAccentContainer: '#bd600f',
  
  // Inverse
  inverseSurface: '#313135',
  inverseOnSurface: '#f2f2f3',
  inversePrimary: '#a0bcf8',
  
  // Scrim & Shadow
  scrim: '#000000',
  shadow: '#000000',
  
  // Fixed colors (optional)
  primaryFixed: '#d0ddfb',
  onPrimaryFixed: '#07235f',
  primaryFixedDim: '#a0bcf8',
  onPrimaryFixedVariant: '#0b348e',
  
  secondaryFixed: '#e0e4eb',
  onSecondaryFixed: '#2b3950',
  secondaryFixedDim: '#c1c9d7',
  onSecondaryFixedVariant: '#485f85',
  
  tertiaryFixed: '#e9ddee',
  onTertiaryFixed: '#3a2145',
  tertiaryFixedDim: '#d3bade',
  onTertiaryFixedVariant: '#73428a',
  
  // Surface brightness
  surfaceBright: '#fafafa',
  surfaceDim: '#e4e4e7',
} as const;

// Typography Tokens
export const typography = {
  // Display
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '600' as const,
    letterSpacing: -4,
    fontFamily: 'Outfit',
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '500' as const,
    letterSpacing: -1,
    fontFamily: 'Outfit',
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '500' as const,
    letterSpacing: -2,
    fontFamily: 'Outfit',
  },
  
  // Headline
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    letterSpacing: -1.5,
    fontFamily: 'Outfit',
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: -1.2,
    fontFamily: 'Outfit',
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '500' as const,
    letterSpacing: -1,
    fontFamily: 'Outfit',
  },
  
  // Title
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.8,
    fontFamily: 'Outfit',
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: -1,
    fontFamily: 'Outfit',
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.95,
    fontFamily: 'Outfit',
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.85,
    fontFamily: 'Outfit',
  },
  
  // Label
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.85,
    fontFamily: 'Outfit',
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
} as const;

// Spacing Tokens (8px base unit)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border Radius Tokens
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;

// Elevation (shadow) Tokens
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  high: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Export all tokens
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
} as const;

export type ColorTokens = typeof colors;
export type TypographyTokens = typeof typography;
export type SpacingTokens = typeof spacing;
export type BorderRadiusTokens = typeof borderRadius;
export type ElevationTokens = typeof elevation;