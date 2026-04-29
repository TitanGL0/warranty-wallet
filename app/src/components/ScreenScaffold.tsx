import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";
import type { TranslationKey } from "../i18n/he";

interface ScreenScaffoldProps {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  iconName: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
  footer?: ReactNode;
  actionLabelKey?: TranslationKey;
  onActionPress?: () => void;
}

export function ScreenScaffold({
  titleKey,
  descriptionKey,
  iconName,
  children,
  footer,
  actionLabelKey,
  onActionPress,
}: ScreenScaffoldProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL } = useI18n();

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons color={colors.accent} name={iconName} size={26} />
        </View>
        <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>{t(titleKey)}</Text>
        <Text style={[styles.description, { textAlign: isRTL ? "right" : "left" }]}>
          {t(descriptionKey)}
        </Text>
        {actionLabelKey && onActionPress ? (
          <Pressable onPress={onActionPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{t(actionLabelKey)}</Text>
          </Pressable>
        ) : null}
      </View>

      {children}
      {footer}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
      padding: 16,
      gap: 16,
    },
    heroCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 24,
      padding: 20,
      gap: 12,
    },
    heroIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: c.text,
      fontSize: 24,
      fontWeight: "700",
    },
    description: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 18,
    },
    primaryButtonText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: "700",
    },
  });
