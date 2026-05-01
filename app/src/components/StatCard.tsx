import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { useThemeColors } from "../hooks/useThemeColors";

type StatCardProps = {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export function StatCard({ value, label, icon, iconColor }: StatCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const iconBorderColor = `${iconColor}26`;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background, borderColor: iconBorderColor }]}>
        <Ionicons color={iconColor} name={icon} size={22} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      padding: 16,
      alignItems: "center",
      gap: 6,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    value: {
      fontSize: 28,
      fontWeight: "800",
      color: c.text,
    },
    label: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "center",
      color: c.textMuted,
    },
  });
