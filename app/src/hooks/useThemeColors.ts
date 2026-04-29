import { useColorScheme } from "react-native";

import { darkColors, lightColors, type ColorPalette } from "../constants/colors";
import { useSettingsStore } from "../store/settingsStore";

export function useThemeColors(): ColorPalette {
  const theme = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const effective = theme === "system" ? (systemScheme ?? "light") : theme;
  return effective === "dark" ? darkColors : lightColors;
}
