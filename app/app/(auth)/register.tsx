import { useState } from "react";
import { Link, Stack } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import type { TranslationKey } from "../../src/i18n/he";
import { registerWithEmail } from "../../src/services/auth";

export default function RegisterScreen() {
  const { t, isRTL } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorKey("error.validation.required");
      return;
    }

    if (password.length < 6) {
      setErrorKey("error.auth.weakPassword");
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);

    try {
      await registerWithEmail(email.trim(), password, name.trim());
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
      <Stack.Screen options={{ title: t("auth.register.title") }} />
      <ScreenScaffold
        descriptionKey="auth.register.description"
        iconName="person-add-outline"
        titleKey="auth.register.title"
      >
        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("auth.register.name")}</Text>
          <TextInput
            editable={!isSubmitting}
            placeholder={t("auth.register.name")}
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }, isSubmitting && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
          />
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("auth.register.email")}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            placeholder={t("auth.register.email")}
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }, isSubmitting && styles.inputDisabled]}
            value={email}
            onChangeText={setEmail}
          />
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("auth.register.password")}</Text>
          <TextInput
            editable={!isSubmitting}
            placeholder={t("auth.register.password")}
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
              <Text style={styles.primaryButtonText}>{t("auth.register.submit")}</Text>
            )}
          </Pressable>
          {errorKey ? (
            <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>
              {t(errorKey)}
            </Text>
          ) : null}
          <Link href="/(auth)/login" style={[styles.link, { textAlign: isRTL ? "right" : "left" }]}>
            {t("auth.register.hasAccount")}
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
    marginTop: 2,
  },
});
