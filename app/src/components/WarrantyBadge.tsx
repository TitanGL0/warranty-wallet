import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
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
        { paddingHorizontal: isSmall ? 7 : 10, paddingVertical: isSmall ? 3 : 6 },
        status === "valid" && styles.validBadge,
        status === "expiringSoon" && styles.expiringSoonBadge,
        status === "expired" && styles.expiredBadge,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: isSmall ? 10 : 12 },
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
      borderRadius: 999,
    },
    text: {
      fontWeight: "700",
    },
    validBadge: {
      backgroundColor: c.accentSoft,
    },
    validText: {
      color: c.accent,
    },
    expiringSoonBadge: {
      backgroundColor: c.warningSoft,
    },
    expiringSoonText: {
      color: c.warning,
    },
    expiredBadge: {
      backgroundColor: c.dangerSoft,
    },
    expiredText: {
      color: c.danger,
    },
  });
