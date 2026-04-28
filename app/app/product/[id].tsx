import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, isRTL } = useI18n();

  return (
    <>
      <Stack.Screen options={{ title: t("productDetail.title") }} />
      <ScreenScaffold
        descriptionKey="productDetail.description"
        iconName="cube-outline"
        titleKey="productDetail.title"
      >
        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("productDetail.identifier")}</Text>
          <Text style={[styles.value, { textAlign: isRTL ? "right" : "left" }]}>{id ?? t("common.placeholder")}</Text>
          <View style={styles.separator} />
          <Text style={[styles.meta, { textAlign: isRTL ? "right" : "left" }]}>{t("product.name")}</Text>
          <Text style={[styles.meta, { textAlign: isRTL ? "right" : "left" }]}>{t("product.warrantyEnd")}</Text>
          <Text style={[styles.meta, { textAlign: isRTL ? "right" : "left" }]}>{t("product.notes")}</Text>
        </View>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
