import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { fontFamilies, fontSizes, lineHeights, radii } from "../constants/typography";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";
import type { WarrantyStatus } from "../types";
import { formatDaysLeftPrecise } from "../utils/warranty";

type WarrantyBadgeProps = {
  status: WarrantyStatus;
  daysLeft: number;
  size?: "default" | "small";
};

export function WarrantyBadge({ status, daysLeft, size = "default" }: WarrantyBadgeProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, language } = useI18n();
  const isSmall = size === "small";

  const content =
    status === "expired"
      ? t("warranty.status.expired")
      : status === "expiringSoon"
        ? `${daysLeft} ${t("warranty.daysUnit")}`
        : formatDaysLeftPrecise(daysLeft, language);

  return (
    <View
      style={[
        styles.badge,
        {
          minHeight: 32,
          paddingHorizontal: isSmall ? 10 : 12,
          paddingVertical: 6,
        },
        status === "valid" && styles.validBadge,
        status === "expiringSoon" && styles.expiringSoonBadge,
        status === "expired" && styles.expiredBadge,
      ]}
    >
      <Text
        ellipsizeMode="tail"
        numberOfLines={1}
        style={[
          styles.text,
          {
            fontSize: isSmall ? fontSizes.xs : fontSizes.sm,
            lineHeight: isSmall ? lineHeights.xs : lineHeights.sm,
          },
          status === "valid" && styles.validText,
          status === "expiringSoon" && styles.expiringSoonText,
          status === "expired" && styles.expiredText,
        ]}
      >
        {content}
      </Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    badge: {
      maxWidth: "100%",
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontFamily: fontFamilies.medium,
      textAlign: "center",
    },
    validBadge: {
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: `${c.accent}26`,
    },
    validText: {
      color: c.accent,
    },
    expiringSoonBadge: {
      backgroundColor: c.warningSoft,
      borderWidth: 1,
      borderColor: `${c.warning}26`,
    },
    expiringSoonText: {
      color: c.warning,
    },
    expiredBadge: {
      backgroundColor: c.dangerSoft,
      borderWidth: 1,
      borderColor: `${c.danger}26`,
    },
    expiredText: {
      color: c.danger,
    },
  });
