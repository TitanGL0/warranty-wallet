import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { colors } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";

export default function AddProductScreen() {
  const { t, isRTL } = useI18n();

  return (
    <>
      <Stack.Screen options={{ title: t("addProduct.title") }} />
      <ScreenScaffold descriptionKey="addProduct.description" iconName="add-circle-outline" titleKey="addProduct.title">
        <View style={styles.grid}>
          <View style={styles.actionCard}>
            <Text style={[styles.actionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("addProduct.takePhoto")}</Text>
            <Text style={[styles.actionBody, { textAlign: isRTL ? "right" : "left" }]}>{t("addProduct.aiAnalyzing")}</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={[styles.actionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("addProduct.uploadImage")}</Text>
            <Text style={[styles.actionBody, { textAlign: isRTL ? "right" : "left" }]}>{t("addProduct.aiDone")}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={[styles.formTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("addProduct.placeholderCardTitle")}
          </Text>
          <Text style={[styles.formBody, { textAlign: isRTL ? "right" : "left" }]}>
            {t("addProduct.placeholderCardDescription")}
          </Text>
        </View>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actionBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8,
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  formBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
