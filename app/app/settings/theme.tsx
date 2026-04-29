import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Children, type ReactNode, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useSettingsStore } from "../../src/store/settingsStore";
import type { Theme } from "../../src/types";

const THEME_OPTIONS: Array<{
  value: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  label: "settings.themeLight" | "settings.themeDark" | "settings.themeSystem";
}> = [
  { value: "light", icon: "sunny-outline", label: "settings.themeLight" },
  { value: "dark", icon: "moon-outline", label: "settings.themeDark" },
  { value: "system", icon: "phone-portrait-outline", label: "settings.themeSystem" },
];

export default function ThemeSettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL } = useI18n();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.theme") }} />
      <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
        <SettingsCard>
          {THEME_OPTIONS.map((option) => {
            const selected = option.value === theme;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setTheme(option.value);
                }}
                style={[styles.themeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                <View style={[styles.themeIcon, selected && styles.themeIconSelected]}>
                  <Ionicons color={selected ? colors.primary : colors.textSubtle} name={option.icon} size={18} />
                </View>
                <Text style={[styles.themeLabel, { textAlign: isRTL ? "right" : "left" }]}>{t(option.label)}</Text>
                <View style={styles.themeSpacer} />
                <View style={styles.checkWrap}>
                  {selected ? <Ionicons color={colors.primary} name="checkmark" size={16} /> : null}
                </View>
              </Pressable>
            );
          })}
        </SettingsCard>
      </ScrollView>
    </>
  );
}

function SettingsCard({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const items = Children.toArray(children);

  return (
    <View style={styles.settingsCard}>
      {items.map((child, index) => (
        <View key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 32,
    },
    settingsCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 16,
    },
    themeRow: {
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: "center",
      gap: 12,
    },
    themeIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    themeIconSelected: {
      backgroundColor: c.primarySoft,
    },
    themeLabel: {
      color: c.text,
      fontSize: 14,
      fontWeight: "700",
    },
    themeSpacer: {
      flex: 1,
    },
    checkWrap: {
      width: 18,
      alignItems: "center",
      justifyContent: "center",
    },
  });
