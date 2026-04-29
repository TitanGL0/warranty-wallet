import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCategoryIcon } from "../constants/categoryIcons";
import { type ColorPalette } from "../constants/colors";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";
import type { Language, Product } from "../types";
import { formatDateDisplay, getDaysLeft } from "../utils/warranty";
import { WarrantyBadge } from "./WarrantyBadge";

type ProductCardProps = {
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

export function ProductCard({ product, onPress, language }: ProductCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isRTL, t } = useI18n();
  const daysLeft = getDaysLeft(product.warrantyEnd);
  const categoryIcon = getCategoryIcon(product.category);
  const iconBg =
    product.status === "valid"
      ? colors.accentSoft
      : product.status === "expiringSoon"
        ? colors.warningSoft
        : colors.dangerSoft;
  const iconColor =
    product.status === "valid"
      ? colors.accent
      : product.status === "expiringSoon"
        ? colors.warning
        : colors.danger;
  const isIncomplete =
    !product.receiptImageUrl ||
    (!product.serial && !product.imei);
  const hasSubtitle = Boolean(product.brand || product.category);
  const categoryLabel =
    product.category && product.category in CATEGORY_LABEL_KEYS
      ? t(CATEGORY_LABEL_KEYS[product.category as keyof typeof CATEGORY_LABEL_KEYS])
      : "";
  const subtitleParts = [
    product.brand,
    categoryLabel,
  ].filter(Boolean);
  const footerParts = [
    formatDateDisplay(product.purchaseDate, language),
    product.serial,
    product.price != null ? formatPrice(product.price, product.currency) : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.topRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[styles.iconBlock, { backgroundColor: iconBg }]}>
          <Ionicons color={iconColor} name={categoryIcon} size={20} />
        </View>
        <Text numberOfLines={1} style={[styles.name, { textAlign: isRTL ? "right" : "left" }]}>
          {product.name}
        </Text>
        {isIncomplete ? (
          <Ionicons color={colors.warning} name="alert-circle-outline" size={14} />
        ) : null}
        <WarrantyBadge daysLeft={daysLeft} status={product.status} />
      </View>

      {hasSubtitle ? (
        <Text style={[styles.subtitle, { textAlign: isRTL ? "right" : "left" }]}>{subtitleParts.join(" · ")}</Text>
      ) : null}

      {footerParts.length > 0 ? (
        <Text style={[styles.footer, { textAlign: isRTL ? "right" : "left" }]}>{footerParts.join(" · ")}</Text>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 6,
    },
    iconBlock: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    topRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    name: {
      flex: 1,
      color: c.text,
      fontSize: 15,
      fontWeight: "700",
    },
    subtitle: {
      color: c.textMuted,
      fontSize: 13,
    },
    footer: {
      color: c.textSubtle,
      fontSize: 12,
      lineHeight: 18,
    },
  });
