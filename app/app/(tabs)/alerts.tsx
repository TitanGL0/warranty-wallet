import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";

export default function AlertsScreen() {
  const { t, isRTL } = useI18n();

  return (
    <ScreenScaffold descriptionKey="alerts.description" iconName="notifications-outline" titleKey="alerts.title">
      <View style={[styles.statsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>{t("alerts.total")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.warning }]}>0</Text>
          <Text style={styles.statLabel}>{t("alerts.expiringSoon")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>0</Text>
          <Text style={styles.statLabel}>{t("alerts.expired")}</Text>
        </View>
      </View>

      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons color={colors.accent} name="checkmark-done-outline" size={32} />
        </View>
        <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("alerts.empty.title")}</Text>
        <Text style={[styles.emptyDescription, { textAlign: isRTL ? "right" : "left" }]}>
          {t("alerts.empty.description")}
        </Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    alignSelf: "stretch",
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyDescription: {
    alignSelf: "stretch",
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
