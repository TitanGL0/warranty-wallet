export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const lineHeights = {
  xs: 17,
  sm: 20,
  md: 22,
  lg: 25,
  xl: 31,
  xxl: 39,
} as const;

export const fontFamilies = {
  regular: "Heebo_400Regular",
  medium: "Heebo_500Medium",
  semibold: "Heebo_600SemiBold",
  bold: "Heebo_700Bold",
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  fontSizes,
  lineHeights,
  fontFamilies,
  fontWeights,
  radii,
} as const;
