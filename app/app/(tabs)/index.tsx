import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";

export default function HomeScreen() {
  const { t, isRTL } = useI18n();

  return (
    <View style={[styles.screen, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={[styles.searchShell, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Ionicons color={colors.textSubtle} name="search-outline" size={18} />
        <TextInput
          editable={false}
          placeholder={t("home.search.placeholder")}
          placeholderTextColor={colors.textSubtle}
          style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
        />
      </View>

      <View style={[styles.filterRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {[t("home.filter.all"), t("home.filter.valid"), t("home.filter.expiringSoon"), t("home.filter.expired")].map(
          (label, index) => (
            <View key={label} style={[styles.filterPill, index === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{label}</Text>
            </View>
          ),
        )}
      </View>

      <View style={styles.heroCard}>
        <View style={styles.walletBadge}>
          <Ionicons color={colors.accent} name="wallet-outline" size={26} />
        </View>
        <Text style={[styles.heroTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.title")}</Text>
        <Text style={[styles.heroDescription, { textAlign: isRTL ? "right" : "left" }]}>
          {t("home.hero.description")}
        </Text>
        <Text style={[styles.heroCaption, { textAlign: isRTL ? "right" : "left" }]}>{t("home.hero.caption")}</Text>
      </View>

      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons color={colors.accent} name="document-text-outline" size={32} />
        </View>
        <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.empty.title")}</Text>
        <Text style={[styles.emptyDescription, { textAlign: isRTL ? "right" : "left" }]}>
          {t("home.empty.description")}
        </Text>
        <Link asChild href="/product/add">
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>{t("home.addProduct")}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 14,
  },
  searchShell: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 14,
  },
  filterRow: {
    gap: 8,
    flexWrap: "wrap",
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.surface,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  walletBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  heroDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroCaption: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    gap: 12,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    alignSelf: "stretch",
  },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    alignSelf: "stretch",
  },
  addButton: {
    minWidth: 180,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
