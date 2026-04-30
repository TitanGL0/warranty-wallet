import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ColorPalette } from "../constants/colors";
import { useI18n } from "../hooks/useI18n";
import { useThemeColors } from "../hooks/useThemeColors";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  required?: boolean;
};

export function FormField({ label, children, required = false }: FormFieldProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isRTL } = useI18n();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.labelRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      {children}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    labelRow: {
      gap: 4,
      alignItems: "center",
    },
    label: {
      color: c.text,
      fontSize: 13,
      fontWeight: "600",
    },
    required: {
      color: c.danger,
      fontSize: 13,
      fontWeight: "700",
    },
  });
