import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { Children, type ReactNode, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
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
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        style={styles.screen}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable
            onPress={() => {
              router.back();
            }}
            style={styles.headerButton}
          >
            <Ionicons color={colors.text} name={isRTL ? "chevron-forward" : "chevron-back"} size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("settings.theme")}</Text>
          <View style={styles.headerSpacer} />
        </View>
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
    headerRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontFamily: fontFamilies.bold,
      textAlign: "center",
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
