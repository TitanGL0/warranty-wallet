import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCategoryIcon } from "../constants/categoryIcons";
import { type ColorPalette } from "../constants/colors";
import { fontFamilies, fontSizes, lineHeights, radii } from "../constants/typography";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";
import type { Language, Product, WarrantyStatus } from "../types";
import { formatDateDisplay, getDaysLeft } from "../utils/warranty";
import { WarrantyBadge } from "./WarrantyBadge";

type DashboardProductCardProps = {
  product: Product;
  onPress: () => void;
  language: Language;
};

const CATEGORY_LABEL_KEYS = {
  refrigerator: "category.refrigerator",
  tv: "category.tv",
  washingMachine: "category.washingMachine",
  smartphone: "category.smartphone",
  computer: "category.computer",
  headphones: "category.headphones",
  ac: "category.ac",
  dishwasher: "category.dishwasher",
  other: "category.other",
} as const;

function formatPrice(price: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "\u20ac" : "\u20aa";

  return `${symbol} ${price}`;
}

export function DashboardProductCard({ product, onPress, language }: DashboardProductCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isRTL, t } = useI18n();
  const daysLeft = getDaysLeft(product.warrantyEnd);
  const categoryIcon = getCategoryIcon(product.category);
  const stripeColor =
    product.status === "valid" ? colors.accent : product.status === "expiringSoon" ? colors.warning : colors.danger;
  const iconColor =
    product.status === "valid"
      ? colors.accent
      : product.status === "expiringSoon"
        ? colors.warning
        : colors.danger;
  const iconBorderColor =
    product.status === "valid"
      ? `${colors.accent}26`
      : product.status === "expiringSoon"
        ? `${colors.warning}26`
        : `${colors.danger}26`;
  const isIncomplete =
    !product.receiptImageUrl ||
    (!product.serial && !product.imei) ||
    (product.requiresInstallation && !product.installationDate) ||
    (product.requiresInstallation && !product.installationImageUrl);

  const stripeStyle = isRTL
    ? { borderRightWidth: 3, borderRightColor: stripeColor }
    : { borderLeftWidth: 3, borderLeftColor: stripeColor };

  const categoryLabel =
    product.category && product.category in CATEGORY_LABEL_KEYS
      ? t(CATEGORY_LABEL_KEYS[product.category as keyof typeof CATEGORY_LABEL_KEYS])
      : "";
  const middleRow = [product.brand, categoryLabel].filter(Boolean).join(" · ");
  const metaColumnAlignment = isRTL ? "flex-start" : "flex-end";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, stripeStyle, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.cardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.detailsColumn}>
          <View style={styles.detailsTopZone}>
            <View style={[styles.topRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconBlock, { backgroundColor: colors.background, borderColor: iconBorderColor }]}>
                <Ionicons color={iconColor} name={categoryIcon} size={22} />
              </View>
              <Text numberOfLines={1} style={[styles.name, { textAlign: isRTL ? "right" : "left" }]}>
                {product.name}
              </Text>
            </View>

            {middleRow ? (
              <Text style={[styles.middleText, { textAlign: isRTL ? "right" : "left" }]}>{middleRow}</Text>
            ) : null}
          </View>

          <View style={styles.detailsBottomZone}>
            <TimelineRow
              isRTL={isRTL}
              language={language}
              purchaseDate={product.purchaseDate}
              status={product.status}
              warrantyEnd={product.warrantyEnd}
            />
          </View>
        </View>

        <View style={[styles.metaColumn, { alignItems: metaColumnAlignment }]}>
          <View style={[styles.metaTopRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <Ionicons color={colors.textSubtle} name={isRTL ? "chevron-back" : "chevron-forward"} size={15} />
            <WarrantyBadge daysLeft={daysLeft} size="small" status={product.status} />
            {isIncomplete ? (
              <Ionicons color={colors.warning} name="alert-circle-outline" size={15} />
            ) : null}
          </View>

          {product.price != null ? (
            <View style={styles.bottomRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{formatPrice(product.price, product.currency)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

type TimelineRowProps = {
  purchaseDate: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  language: Language;
  isRTL: boolean;
};

function TimelineRow({ purchaseDate, warrantyEnd, status, language, isRTL }: TimelineRowProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const isExpired = status === "expired";
  const endIconName = isExpired ? "close-circle" : status === "expiringSoon" ? "alert-circle" : "shield-checkmark";
  const endIconColor = isExpired ? colors.danger : status === "expiringSoon" ? colors.warning : colors.accent;

  return (
    <View style={[styles.timeline, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      <View style={styles.timelineIcons}>
        <Ionicons color={colors.textSubtle} name="calendar-outline" size={12} />
        <View style={styles.timelineConnector} />
        <Ionicons color={endIconColor} name={endIconName} size={12} />
      </View>
      <View style={styles.timelineTexts}>
        <Text style={[styles.timelineText, { textAlign: isRTL ? "right" : "left" }]}>
          {`${t("product.purchasedShort")}: ${formatDateDisplay(purchaseDate, language)}`}
        </Text>
        <Text
          style={[
            styles.timelineText,
            { textAlign: isRTL ? "right" : "left" },
            isExpired && { color: colors.danger },
          ]}
        >
          {`${t("product.warrantyUntilShort")}: ${formatDateDisplay(warrantyEnd, language)}`}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      overflow: "hidden",
    },
    cardRow: {
      gap: 12,
      alignItems: "stretch",
    },
    detailsColumn: {
      flex: 1,
      justifyContent: "space-between",
      gap: 8,
    },
    detailsTopZone: {
      gap: 8,
    },
    detailsBottomZone: {
      justifyContent: "flex-end",
    },
    metaColumn: {
      minWidth: 96,
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 2,
    },
    iconBlock: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    topRow: {
      alignItems: "center",
      gap: 12,
    },
    metaTopRow: {
      alignItems: "center",
      gap: 6,
    },
    name: {
      flex: 1,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontFamily: fontFamilies.semibold,
      color: c.text,
    },
    middleText: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    timeline: {
      gap: 8,
      alignItems: "flex-start",
    },
    timelineIcons: {
      alignItems: "center",
      gap: 4,
    },
    timelineConnector: {
      width: 1,
      flex: 1,
      minHeight: 8,
      backgroundColor: c.border,
    },
    timelineTexts: {
      flex: 1,
      gap: 4,
    },
    timelineText: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
      color: c.textSubtle,
    },
    bottomRow: {
      width: "100%",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    chip: {
      backgroundColor: c.background,
      minHeight: 32,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    chipText: {
      maxWidth: "100%",
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.medium,
      color: c.textMuted,
    },
  });
