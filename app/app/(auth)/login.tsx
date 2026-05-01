import { useMemo, useState } from "react";
import { Link, Stack } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AuthShell } from "../../src/components/AuthShell";
import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import { loginWithEmail } from "../../src/services/auth";

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorKey("error.validation.required");
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);

    try {
      await loginWithEmail(email.trim(), password);
    } catch (error) {
      const nextErrorKey =
        typeof error === "object" && error !== null && "i18nKey" in error
          ? (error.i18nKey as TranslationKey)
          : "error.auth.generic";
      setErrorKey(nextErrorKey);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthShell>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("auth.login.title")}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t("auth.login.email")}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              placeholder={t("auth.login.email")}
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }, isSubmitting && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t("auth.login.password")}
            </Text>
            <TextInput
              editable={!isSubmitting}
              placeholder={t("auth.login.password")}
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }, isSubmitting && styles.inputDisabled]}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryButton}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>{t("auth.login.submit")}</Text>
            )}
          </Pressable>

          {errorKey ? (
            <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>
              {t(errorKey)}
            </Text>
          ) : null}
        </View>

        <Link href="/(auth)/register" style={styles.switchLink}>
          {t("auth.login.noAccount")}
        </Link>
      </AuthShell>
    </>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 16,
    },
    cardTitle: {
      color: c.text,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontFamily: fontFamilies.bold,
    },
    fieldGroup: {
      gap: 6,
    },
    label: {
      color: c.textMuted,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.semibold,
      letterSpacing: 0.3,
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      color: c.text,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.regular,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    primaryButton: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    primaryButtonText: {
      color: c.surface,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    errorText: {
      color: c.danger,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    switchLink: {
      color: c.primary,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.semibold,
      textAlign: "center",
    },
  });
