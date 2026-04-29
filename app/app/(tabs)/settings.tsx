import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { Children, type ReactNode, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { useProducts } from "../../src/hooks/useProducts";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { updateUserProfileLanguage } from "../../src/services/firestore";
import { exportProductsToCSV } from "../../src/services/exportProducts";
import { useAuthStore } from "../../src/store/authStore";
import { useSettingsStore } from "../../src/store/settingsStore";
import type { Language, Theme } from "../../src/types";

const THEME_LABEL_KEYS: Record<Theme, "settings.themeLight" | "settings.themeDark" | "settings.themeSystem"> = {
  light: "settings.themeLight",
  dark: "settings.themeDark",
  system: "settings.themeSystem",
};

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL, language } = useI18n();
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const theme = useSettingsStore((state) => state.theme);
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { products } = useProducts();
  const [isExporting, setIsExporting] = useState(false);
  const languageOptions: Language[] = ["he", "en"];
  const displayName = profile?.displayName || user?.displayName || "";

  const handleExport = async () => {
    if (products.length === 0) {
      Alert.alert(t("settings.export.noProducts"), t("settings.export.noProductsMsg"));
      return;
    }
    setIsExporting(true);
    try {
      await exportProductsToCSV(products, t("settings.export.shareTitle"));
    } catch {
      Alert.alert(t("settings.export.errorTitle"), t("settings.export.errorMsg"));
    } finally {
      setIsExporting(false);
    }
  };
  const email = profile?.email || user?.email || "";
  const firstCharacter = displayName.trim().charAt(0);

  return (
    <>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={styles.avatar}>
            {firstCharacter ? (
              <Text style={styles.avatarText}>{firstCharacter.toUpperCase()}</Text>
            ) : (
              <Ionicons color={colors.primary} name="person-outline" size={22} />
            )}
          </View>
          <View style={styles.profileText}>
            <Text numberOfLines={1} style={[styles.profileName, { textAlign: isRTL ? "right" : "left" }]}>
              {displayName || email}
            </Text>
            <Text numberOfLines={1} style={[styles.profileEmail, { textAlign: isRTL ? "right" : "left" }]}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.proCard}>
          <View style={[styles.proHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Ionicons color={colors.primary} name="star" size={22} />
            <Text style={[styles.proTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.pro.title")}</Text>
          </View>
          <Text style={[styles.proDescription, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.pro.description")}</Text>
          <Pressable
            onPress={() => {
              Alert.alert(t("settings.pro.title"), t("settings.pro.comingSoon"));
            }}
            style={styles.proButton}
          >
            <Text style={styles.proButtonText}>{t("settings.pro.upgradeButton")}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.section.preferences")}</Text>
        <SettingsCard>
          <View style={styles.languageBlock}>
            <Row
              icon="language-outline"
              rtl={isRTL}
              subtitle={language === "he" ? t("settings.languageHe") : t("settings.languageEn")}
              title={t("settings.language")}
            />
            <View style={[styles.languageRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {languageOptions.map((option) => {
                const selected = option === language;
                const label = option === "he" ? t("settings.languageHe") : t("settings.languageEn");

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      void (async () => {
                        await setLanguage(option);
                        if (profile) {
                          await updateUserProfileLanguage(profile.uid, option);
                        }
                      })();
                    }}
                    style={[styles.languageButton, selected && styles.languageButtonSelected]}
                  >
                    <Text style={[styles.languageButtonText, selected && styles.languageButtonTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.caption, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.reloadHint")}</Text>
          </View>
          <Row
            chevron
            icon="color-palette-outline"
            onPress={() => {
              router.push("/settings/theme");
            }}
            rtl={isRTL}
            subtitle={t(THEME_LABEL_KEYS[theme])}
            title={t("settings.theme")}
          />
          <Row
            chevron
            icon="notifications-outline"
            onPress={() => {
              router.push("/settings/notifications");
            }}
            rtl={isRTL}
            subtitle={t("settings.notifications.masterDesc")}
            title={t("settings.notifications.title")}
          />
        </SettingsCard>

        <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.section.data")}</Text>
        <SettingsCard>
          <Row
            icon="download-outline"
            loading={isExporting}
            onPress={handleExport}
            rtl={isRTL}
            subtitle={t("settings.exportData.description")}
            title={t("settings.exportData")}
          />
          <Row
            destructive
            icon="trash-outline"
            onPress={() => {
              Alert.alert(t("settings.clearData.confirmTitle"), t("settings.clearData.confirmMessage"), [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("settings.clearData.confirmAction"),
                  style: "destructive",
                  onPress: () => {
                    console.log("[Settings] clear data action not implemented yet");
                  },
                },
              ]);
            }}
            rtl={isRTL}
            subtitle={t("settings.clearData.description")}
            title={t("settings.clearData")}
          />
        </SettingsCard>

        <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.section.account")}</Text>
        <SettingsCard>
          <Row
            destructive
            icon="log-out-outline"
            onPress={() => {
              void signOut();
            }}
            rtl={isRTL}
            subtitle={t("settings.signOutDescription")}
            title={t("settings.signOut")}
          />
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

function Row({
  icon,
  title,
  subtitle,
  value,
  rtl,
  onPress,
  destructive = false,
  chevron = false,
  loading = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value?: string;
  rtl: boolean;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  loading?: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      disabled={!onPress || loading}
      onPress={onPress}
      style={[styles.row, { flexDirection: rtl ? "row-reverse" : "row" }, loading && { opacity: 0.6 }]}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons color={destructive ? colors.danger : colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive, { textAlign: rtl ? "right" : "left" }]}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { textAlign: rtl ? "right" : "left" }]}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : value ? (
        <Text style={[styles.rowValue, { textAlign: rtl ? "left" : "right" }]}>{value}</Text>
      ) : null}
      {!loading && chevron ? (
        <Ionicons color={colors.textSubtle} name={rtl ? "chevron-back" : "chevron-forward"} size={16} />
      ) : null}
    </Pressable>
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
    profileCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 14,
      alignItems: "center",
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
    },
    avatarText: {
      color: c.primary,
      fontSize: 20,
      fontWeight: "700",
    },
    profileText: {
      flex: 1,
      gap: 4,
    },
    profileName: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },
    profileEmail: {
      color: c.textMuted,
      fontSize: 13,
    },
    proCard: {
      backgroundColor: c.primarySoft,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `${c.primary}33`,
      padding: 18,
      gap: 12,
    },
    proHeader: {
      alignItems: "center",
      gap: 10,
    },
    proTitle: {
      color: c.primary,
      fontSize: 17,
      fontWeight: "800",
    },
    proDescription: {
      color: c.text,
      fontSize: 14,
      lineHeight: 22,
    },
    proButton: {
      minHeight: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
    },
    proButtonText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: "700",
    },
    sectionLabel: {
      color: c.textSubtle,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
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
    row: {
      minHeight: 72,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 12,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
    },
    rowIconDestructive: {
      backgroundColor: c.dangerSoft,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "700",
    },
    rowTitleDestructive: {
      color: c.danger,
    },
    rowSubtitle: {
      color: c.textSubtle,
      fontSize: 12,
      lineHeight: 18,
    },
    rowValue: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    languageBlock: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    languageRow: {
      gap: 10,
    },
    languageButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    languageButtonSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    languageButtonText: {
      color: c.text,
      fontSize: 14,
      fontWeight: "700",
    },
    languageButtonTextSelected: {
      color: c.surface,
    },
    caption: {
      color: c.textSubtle,
      fontSize: 12,
      lineHeight: 18,
    },
  });
