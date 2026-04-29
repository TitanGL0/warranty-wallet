export const lightColors = {
  background: "#f5f5f0",
  surface: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6f6f69",
  textSubtle: "#8c8c86",
  border: "#e8e8e4",
  accent: "#1D9E75",
  accentSoft: "#e7f7f1",
  warning: "#b45309",
  warningSoft: "#fff3e0",
  danger: "#b91c1c",
  dangerSoft: "#fde8e8",
  primary: "#1A6BCC",
  primarySoft: "#EBF2FC",
} as const;

export const darkColors = {
  background: "#0f0f10",
  surface: "#1c1c1e",
  text: "#f2f2f7",
  textMuted: "#aeaeb2",
  textSubtle: "#8e8e93",
  border: "#38383a",
  accent: "#30d158",
  accentSoft: "#0f3324",
  warning: "#ff9f0a",
  warningSoft: "#3d2800",
  danger: "#ff453a",
  dangerSoft: "#3d0e0d",
  primary: "#0a84ff",
  primarySoft: "#00244f",
} as const;

export type ColorPalette = {
  [K in keyof typeof lightColors]: string;
};

export const colors = lightColors;
