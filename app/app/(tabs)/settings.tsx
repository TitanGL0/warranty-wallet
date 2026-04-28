import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { updateUserProfileLanguage } from "../../src/services/firestore";
import { useAuthStore } from "../../src/store/authStore";
import { useSettingsStore } from "../../src/store/settingsStore";
import type { Language } from "../../src/types";

export default function SettingsScreen() {
  const { t, isRTL, language } = useI18n();
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const languageOptions: Language[] = ["he", "en"];

  return (
    <ScreenScaffold descriptionKey="settings.description" iconName="settings-outline" titleKey="settings.title">
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.language")}</Text>
        <Text style={[styles.sectionBody, { textAlign: isRTL ? "right" : "left" }]}>
          {t("settings.languageDescription")}
        </Text>
        <Text style={[styles.caption, { textAlign: isRTL ? "right" : "left" }]}>
          {t("settings.currentLanguage")}: {language === "he" ? t("settings.languageHe") : t("settings.languageEn")}
        </Text>
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

      <View style={styles.sectionCard}>
        <Row icon="notifications-outline" rtl={isRTL} title={t("settings.notifications")} subtitle={t("settings.notificationsDescription")} value={notificationsEnabled ? t("common.comingSoon") : t("common.comingSoon")} />
        <Row icon="download-outline" rtl={isRTL} title={t("settings.exportData")} subtitle={t("common.placeholder")} value={t("common.comingSoon")} />
        <Row icon="trash-outline" rtl={isRTL} title={t("settings.clearData")} subtitle={t("common.placeholder")} value={t("common.comingSoon")} destructive />
        <Row
          icon="log-out-outline"
          onPress={() => {
            void signOut();
          }}
          rtl={isRTL}
          title={t("settings.signOut")}
          subtitle={t("settings.signOutDescription")}
          destructive
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.about")}</Text>
        <Text style={[styles.sectionBody, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.aboutDescription")}</Text>
      </View>
    </ScreenScaffold>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value?: string;
  rtl: boolean;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { flexDirection: rtl ? "row-reverse" : "row" }]}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons color={destructive ? colors.danger : colors.accent} name={icon} size={18} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive && { color: colors.danger }, { textAlign: rtl ? "right" : "left" }]}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { textAlign: rtl ? "right" : "left" }]}>{subtitle}</Text>
      </View>
      {value ? <Text style={[styles.rowValue, { textAlign: rtl ? "left" : "right" }]}>{value}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
  languageRow: {
    gap: 10,
  },
  languageButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  languageButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  languageButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  languageButtonTextSelected: {
    color: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  rowIconDestructive: {
    backgroundColor: colors.dangerSoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
