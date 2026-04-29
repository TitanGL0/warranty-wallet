import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { useThemeColors } from "../hooks/useThemeColors";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  isRTL: boolean;
};

export function SectionHeader({ title, actionLabel, onActionPress, isRTL }: SectionHeaderProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress}>
          <Text style={[styles.action, { textAlign: isRTL ? "left" : "right" }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    title: {
      flex: 1,
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    action: {
      color: c.primary,
      fontSize: 13,
      fontWeight: "700",
    },
  });
