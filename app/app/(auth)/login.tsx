import { useState } from "react";
import { Link, Stack } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { loginWithEmail } from "../../src/services/auth";
import type { TranslationKey } from "../../src/i18n/he";

export default function LoginScreen() {
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
      <Stack.Screen options={{ title: t("auth.login.title") }} />
      <ScreenScaffold
        descriptionKey="auth.login.description"
        iconName="log-in-outline"
        titleKey="auth.login.title"
      >
        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("auth.login.email")}</Text>
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
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("auth.login.password")}</Text>
          <TextInput
            editable={!isSubmitting}
            placeholder={t("auth.login.password")}
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }, isSubmitting && styles.inputDisabled]}
            value={password}
            onChangeText={setPassword}
          />
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
          <Link href="/(auth)/register" style={[styles.link, { textAlign: isRTL ? "right" : "left" }]}>
            {t("auth.login.noAccount")}
          </Link>
        </View>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textSubtle,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20,
    marginTop: -2,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
