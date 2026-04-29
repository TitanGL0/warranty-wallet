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

  return (
    <View style={styles.card}>
      <Ionicons color={iconColor} name={icon} size={26} />
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
