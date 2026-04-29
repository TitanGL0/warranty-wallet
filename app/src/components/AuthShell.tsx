import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useMemo } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";

export function AuthShell({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons color={colors.surface} name="shield-checkmark-outline" size={38} />
          </View>
          <Text style={styles.brandName}>{t("home.dashboardTitle")}</Text>
          <Text style={styles.brandTagline}>{t("auth.tagline")}</Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      gap: 24,
      paddingBottom: 40,
    },
    brand: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    brandIcon: {
      width: 80,
      height: 80,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    brandName: {
      color: c.text,
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
    },
    brandTagline: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
  });
