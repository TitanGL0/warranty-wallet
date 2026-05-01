import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORY_LABEL_KEYS } from "../../src/constants/categories";
import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { useI18n } from "../../src/hooks/useI18n";
import { useProducts } from "../../src/hooks/useProducts";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import type { Language, Product } from "../../src/types";
import { formatDateDisplay, formatDaysLeftPrecise, getDaysLeft } from "../../src/utils/warranty";

type AlertFilter = "all" | "expiring" | "expired" | "missing";
type AlertVariant = Exclude<AlertFilter, "all">;

const FILTER_ORDER: AlertFilter[] = ["all", "expiring", "expired", "missing"];

export default function AlertsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { products, isLoading, error } = useProducts();
  const { t, isRTL, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");

  const expiringSoon = useMemo(
    () => products.filter((product) => product.status === "expiringSoon"),
    [products],
  );
  const expired = useMemo(
    () => products.filter((product) => product.status === "expired"),
    [products],
  );
  const missingDetails = useMemo(
    () =>
      products.filter(
        (product) =>
          !product.receiptImageUrl ||
          !product.purchaseDate ||
          product.warrantyMonths <= 0 ||
          (!product.serial && !product.imei),
      ),
    [products],
  );

  const uniqueAlertCount = useMemo(() => {
    const ids = new Set<string>();

    expiringSoon.forEach((product) => ids.add(product.id));
    expired.forEach((product) => ids.add(product.id));
    missingDetails.forEach((product) => ids.add(product.id));

    return ids.size;
  }, [expiringSoon, expired, missingDetails]);

  const summaryText = useMemo(() => {
    if (expired.length > 0 && expiringSoon.length > 0) {
      return `${expired.length} ${t("alerts.summary.expiredShort")}, ${expiringSoon.length} ${t("alerts.summary.expiringShort")}`;
    }

    if (expired.length > 0) {
      return `${expired.length} ${t("alerts.summary.active")}`;
    }

    if (expiringSoon.length > 0) {
      return `${expiringSoon.length} ${t("alerts.summary.active")}`;
    }

    if (missingDetails.length > 0) {
      return `${missingDetails.length} ${t("alerts.summary.active")}`;
    }

    return null;
  }, [expired.length, expiringSoon.length, missingDetails.length, t]);

  const filteredItems =
    activeFilter === "expiring"
      ? expiringSoon
      : activeFilter === "expired"
        ? expired
        : activeFilter === "missing"
          ? missingDetails
          : [];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <Tabs.Screen options={{ headerShown: false }} />
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>{t("alerts.title")}</Text>
        <ScrollView
          horizontal
          contentContainerStyle={[styles.filtersContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          showsHorizontalScrollIndicator={false}
        >
          {FILTER_ORDER.map((filter) => {
            const selected = activeFilter === filter;
            const count =
              filter === "all"
                ? uniqueAlertCount
                : filter === "expiring"
                  ? expiringSoon.length
                  : filter === "expired"
                    ? expired.length
                    : missingDetails.length;
            const countTone =
              filter === "expiring"
                ? styles.expiringCount
                : filter === "expired"
                  ? styles.expiredCount
                  : filter === "missing"
                    ? styles.missingCount
                    : styles.defaultChipCount;
            const countTextTone =
              filter === "expiring"
                ? styles.expiringCountText
                : filter === "expired"
                  ? styles.expiredCountText
                  : filter === "missing"
                    ? styles.missingCountText
                    : styles.defaultChipCountText;

            return (
              <Pressable
                key={filter}
                onPress={() => {
                  setActiveFilter(filter);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.selectedChipBase,
                  selected && styles.selectedPrimaryChip,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Text style={[styles.filterChipText, selected && styles.selectedPrimaryChipText]}>{t(filterLabelKey(filter))}</Text>
                <View style={[styles.filterChipCount, selected ? styles.selectedChipCount : countTone]}>
                  <Text style={[styles.filterChipCountText, selected ? styles.selectedChipCountText : countTextTone]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {summaryText ? (
          <Text style={[styles.summaryText, { textAlign: isRTL ? "right" : "left" }]}>{summaryText}</Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>{t(error as TranslationKey)}</Text>
      ) : activeFilter === "all" ? (
        uniqueAlertCount === 0 ? (
          <EmptyState descriptionKey="alerts.empty.none" iconColor={colors.accent} iconName="shield-checkmark-outline" />
        ) : (
          <View style={styles.sections}>
            {expiringSoon.length > 0 ? (
              <AlertSection
                isRTL={isRTL}
                items={expiringSoon}
                language={language}
                title={t("alerts.expiringSoon")}
                variant="expiring"
              />
            ) : null}
            {expired.length > 0 ? (
              <AlertSection
                isRTL={isRTL}
                items={expired}
                language={language}
                title={t("alerts.expired")}
                variant="expired"
              />
            ) : null}
            {missingDetails.length > 0 ? (
              <AlertSection
                isRTL={isRTL}
                items={missingDetails}
                language={language}
                title={t("alerts.missingDetails")}
                variant="missing"
              />
            ) : null}
          </View>
        )
      ) : filteredItems.length === 0 ? (
        <EmptyState descriptionKey={emptyKeyForFilter(activeFilter)} iconColor={emptyIconColor(activeFilter, colors)} iconName={emptyIconName(activeFilter)} />
      ) : (
        <View style={styles.sectionList}>
          {filteredItems.map((item) => (
            <AlertCard key={`${activeFilter}-${item.id}`} isRTL={isRTL} language={language} product={item} variant={activeFilter} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function AlertSection({
  title,
  items,
  language,
  isRTL,
  variant,
}: {
  title: string;
  items: Product[];
  language: Language;
  isRTL: boolean;
  variant: AlertVariant;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{title}</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{items.length}</Text>
        </View>
      </View>
      <View style={styles.sectionList}>
        {items.map((item) => (
          <AlertCard key={`${variant}-${item.id}`} isRTL={isRTL} language={language} product={item} variant={variant} />
        ))}
      </View>
    </View>
  );
}

function AlertCard({
  product,
  language,
  isRTL,
  variant,
}: {
  product: Product;
  language: Language;
  isRTL: boolean;
  variant: AlertVariant;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();

  const daysLeft = getDaysLeft(product.warrantyEnd);
  const categoryLabel =
    product.category && product.category in CATEGORY_LABEL_KEYS
      ? t(CATEGORY_LABEL_KEYS[product.category as keyof typeof CATEGORY_LABEL_KEYS])
      : product.category;

  const metaParts = [product.brand, categoryLabel].filter(Boolean);
  const detailParts =
    variant === "missing"
      ? [
          !product.receiptImageUrl ? t("settings.notifications.missingReceipt") : null,
          !product.purchaseDate ? t("product.purchaseDate") : null,
          product.warrantyMonths <= 0 ? t("product.warrantyDuration") : null,
          !product.serial && !product.imei ? t("product.serial") : null,
        ].filter(Boolean)
      : [
          product.purchaseDate ? `${t("product.purchasedShort")} ${formatDateDisplay(product.purchaseDate, language)}` : null,
          product.warrantyEnd ? `${t("product.warrantyUntilShort")} ${formatDateDisplay(product.warrantyEnd, language)}` : null,
        ].filter(Boolean);

  return (
    <Pressable
      onPress={() => {
        router.push(`/product/${product.id}`);
      }}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.cardTopRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.cardTextBlock}>
          <Text numberOfLines={1} style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {product.name}
          </Text>
          {metaParts.length > 0 ? (
            <Text numberOfLines={1} style={[styles.cardMeta, { textAlign: isRTL ? "right" : "left" }]}>
              {metaParts.join(" · ")}
            </Text>
          ) : null}
        </View>
        <View style={[styles.cardTopTrailing, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <AlertBadge daysLeft={daysLeft} variant={variant} />
          <Ionicons color={colors.textSubtle} name={isRTL ? "chevron-back" : "chevron-forward"} size={16} />
        </View>
      </View>

      {detailParts.length > 0 ? (
        <Text style={[styles.cardDetails, { textAlign: isRTL ? "right" : "left" }]}>
          {variant === "missing" ? detailParts.join(" · ") : detailParts.join("  •  ")}
        </Text>
      ) : null}
    </Pressable>
  );
}

function AlertBadge({ variant, daysLeft }: { variant: AlertVariant; daysLeft: number }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, language } = useI18n();

  const content =
    variant === "expired"
      ? t("alerts.badge.expiredFull")
      : variant === "expiring"
        ? `${t("alerts.badge.expiresIn")} ${formatDaysLeftPrecise(daysLeft, language)}`
        : t("alerts.badge.missing");

  return (
    <View
      style={[
        styles.badge,
        variant === "expiring" && styles.badgeExpiring,
        variant === "expired" && styles.badgeExpired,
        variant === "missing" && styles.badgeMissing,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          variant === "expiring" && styles.badgeExpiringText,
          variant === "expired" && styles.badgeExpiredText,
          variant === "missing" && styles.badgeMissingText,
        ]}
      >
        {content}
      </Text>
    </View>
  );
}

function EmptyState({
  descriptionKey,
  iconName,
  iconColor,
}: {
  descriptionKey: TranslationKey;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL } = useI18n();

  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons color={iconColor} name={iconName} size={28} />
      </View>
      <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t(descriptionKey)}</Text>
    </View>
  );
}

function filterLabelKey(filter: AlertFilter): TranslationKey {
  switch (filter) {
    case "expiring":
      return "alerts.filter.expiring";
    case "expired":
      return "alerts.filter.expired";
    case "missing":
      return "alerts.filter.missing";
    case "all":
    default:
      return "alerts.filter.all";
  }
}

function emptyKeyForFilter(filter: Exclude<AlertFilter, "all">): TranslationKey {
  switch (filter) {
    case "expiring":
      return "alerts.empty.expiring";
    case "expired":
      return "alerts.empty.expired";
    case "missing":
    default:
      return "alerts.empty.missing";
  }
}

function emptyIconName(filter: Exclude<AlertFilter, "all">): keyof typeof Ionicons.glyphMap {
  switch (filter) {
    case "expiring":
      return "time-outline";
    case "expired":
      return "alert-circle-outline";
    case "missing":
    default:
      return "document-text-outline";
  }
}

function emptyIconColor(filter: Exclude<AlertFilter, "all">, colors: ColorPalette): string {
  switch (filter) {
    case "expiring":
      return colors.warning;
    case "expired":
      return colors.danger;
    case "missing":
    default:
      return colors.primary;
  }
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: 16,
      paddingBottom: 24,
      gap: 16,
    },
    headerBlock: {
      gap: 12,
    },
    title: {
      color: c.text,
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontFamily: fontFamilies.bold,
    },
    filtersContent: {
      gap: 8,
    },
    filterChip: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    selectedChipBase: {
      borderColor: "transparent",
    },
    selectedPrimaryChip: {
      backgroundColor: c.primarySoft,
    },
    filterChipText: {
      color: c.text,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.semibold,
    },
    selectedPrimaryChipText: {
      color: c.primary,
    },
    filterChipCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    defaultChipCount: {
      backgroundColor: c.background,
    },
    expiringCount: {
      backgroundColor: c.warningSoft,
    },
    expiredCount: {
      backgroundColor: c.dangerSoft,
    },
    missingCount: {
      backgroundColor: c.primarySoft,
    },
    selectedChipCount: {
      backgroundColor: c.surface,
    },
    filterChipCountText: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.bold,
    },
    defaultChipCountText: {
      color: c.textMuted,
    },
    expiringCountText: {
      color: c.warning,
    },
    expiredCountText: {
      color: c.danger,
    },
    missingCountText: {
      color: c.primary,
    },
    selectedChipCountText: {
      color: c.text,
    },
    summaryText: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.semibold,
    },
    centerState: {
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: c.danger,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.regular,
    },
    sections: {
      gap: 18,
    },
    section: {
      gap: 10,
    },
    sectionHeader: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    sectionTitle: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontFamily: fontFamilies.bold,
    },
    sectionCount: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    sectionCountText: {
      color: c.textMuted,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.bold,
    },
    sectionList: {
      gap: 10,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 8,
    },
    cardTopRow: {
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    cardTextBlock: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      color: c.text,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.bold,
    },
    cardMeta: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    cardTopTrailing: {
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },
    cardDetails: {
      color: c.textSubtle,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.semibold,
    },
    badgeExpiring: {
      backgroundColor: c.warningSoft,
    },
    badgeExpiringText: {
      color: c.warning,
    },
    badgeExpired: {
      backgroundColor: c.dangerSoft,
    },
    badgeExpiredText: {
      color: c.danger,
    },
    badgeMissing: {
      backgroundColor: c.primarySoft,
    },
    badgeMissingText: {
      color: c.primary,
    },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 24,
      gap: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 220,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      color: c.text,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontFamily: fontFamilies.bold,
    },
  });
