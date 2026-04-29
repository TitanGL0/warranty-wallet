import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProductCard } from "../../src/components/ProductCard";
import { type ColorPalette } from "../../src/constants/colors";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import type { Product } from "../../src/types";

export default function AlertsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { products, isLoading, error } = useProducts();
  const { t, isRTL, language } = useI18n();

  const expiringSoon = products.filter((product) => product.status === "expiringSoon");
  const expired = products.filter((product) => product.status === "expired");

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>{t("alerts.title")}</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>{t(error as TranslationKey)}</Text>
      ) : expiringSoon.length === 0 && expired.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.accent} name="checkmark-done-outline" size={32} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("alerts.empty.title")}</Text>
          <Text style={[styles.emptyDescription, { textAlign: isRTL ? "right" : "left" }]}>{t("alerts.empty.description")}</Text>
        </View>
      ) : (
        <>
          {expiringSoon.length > 0 ? <Section isRTL={isRTL} items={expiringSoon} language={language} title={t("alerts.expiringSoon")} /> : null}
          {expired.length > 0 ? <Section isRTL={isRTL} items={expired} language={language} title={t("alerts.expired")} /> : null}
        </>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  items,
  language,
  isRTL,
}: {
  title: string;
  items: Product[];
  language: "he" | "en";
  isRTL: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{title}</Text>
      <View style={styles.sectionList}>
        {items.map((item) => (
          <ProductCard
            key={item.id}
            language={language}
            product={item}
            onPress={() => {
              router.push(`/product/${item.id}`);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    title: {
      color: c.text,
      fontSize: 26,
      fontWeight: "700",
    },
    centerState: {
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: c.danger,
      fontSize: 14,
      lineHeight: 22,
    },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 12,
      alignItems: "center",
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      alignSelf: "stretch",
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    emptyDescription: {
      alignSelf: "stretch",
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    sectionList: {
      gap: 12,
    },
  });
