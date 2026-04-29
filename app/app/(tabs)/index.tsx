import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardProductCard } from "../../src/components/DashboardProductCard";
import { SectionHeader } from "../../src/components/SectionHeader";
import { StatCard } from "../../src/components/StatCard";
import { type ColorPalette } from "../../src/constants/colors";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useAuthStore } from "../../src/store/authStore";

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { products, isLoading } = useProducts();
  const { t, isRTL, language } = useI18n();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const firstName = (profile?.displayName || user?.displayName || "").split(" ")[0];
  const greetingText = firstName ? `${t("home.greeting")}, ${firstName}` : t("home.greetingGeneric");
  const expiringSoon = useMemo(() => products.filter((product) => product.status === "expiringSoon"), [products]);
  const expired = useMemo(() => products.filter((product) => product.status === "expired"), [products]);
  const recentProducts = useMemo(() => products.slice(0, 3), [products]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={[styles.greetingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.greetingTextBlock}>
          <Text style={[styles.greeting, { textAlign: isRTL ? "right" : "left" }]}>{greetingText}</Text>
          <Text style={[styles.greetingSubtitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.greetingSubtitle")}</Text>
        </View>

        <View style={[styles.greetingActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable
            onPress={() => {
              router.navigate("/(tabs)/alerts");
            }}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text} name="notifications-outline" size={22} />
            {expiringSoon.length + expired.length > 0 ? <View style={styles.badgeDot} /> : null}
          </Pressable>

          <Pressable
            onPress={() => {
              router.push("/product/add");
            }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>{t("home.addProductShort")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.statsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <StatCard icon="checkmark-circle" iconColor={colors.accent} label={t("home.stats.total")} value={products.length} />
        <StatCard icon="alert-circle" iconColor={colors.warning} label={t("home.stats.expiringSoon")} value={expiringSoon.length} />
        <StatCard icon="close-circle" iconColor={colors.danger} label={t("home.stats.expired")} value={expired.length} />
      </View>

      {!isLoading && products.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            actionLabel={t("home.viewAll")}
            isRTL={isRTL}
            onActionPress={() => {
              router.push("/products");
            }}
            title={t("home.recentlyAdded")}
          />
          <View style={styles.cardList}>
            {recentProducts.map((product) => (
              <DashboardProductCard
                key={product.id}
                language={language}
                product={product}
                onPress={() => {
                  router.push(`/product/${product.id}`);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader isRTL={isRTL} title={t("home.expiringSoon")} />

        {products.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons color={colors.accent} name="document-text-outline" size={32} />
            </View>
            <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.empty.title")}</Text>
            <Text style={[styles.emptyDescription, { textAlign: isRTL ? "right" : "left" }]}>{t("home.empty.description")}</Text>
            <Pressable
              onPress={() => {
                router.push("/product/add");
              }}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>{t("home.addProduct")}</Text>
            </Pressable>
          </View>
        ) : expiringSoon.length > 0 ? (
          <View style={styles.cardList}>
            {expiringSoon.map((product) => (
              <DashboardProductCard
                key={product.id}
                language={language}
                product={product}
                onPress={() => {
                  router.push(`/product/${product.id}`);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.goodCard}>
            <View style={styles.goodIcon}>
              <Ionicons color={colors.accent} name="checkmark-done-outline" size={28} />
            </View>
            <Text style={[styles.goodTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.allGood")}</Text>
            <Text style={[styles.goodDescription, { textAlign: isRTL ? "right" : "left" }]}>{t("home.allGoodDesc")}</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
      gap: 20,
      paddingBottom: 40,
    },
    loadingScreen: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    greetingRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    greetingTextBlock: {
      flex: 1,
      gap: 4,
    },
    greeting: {
      color: c.text,
      fontSize: 26,
      fontWeight: "800",
    },
    greetingSubtitle: {
      color: c.textMuted,
      fontSize: 14,
    },
    greetingActions: {
      alignItems: "center",
      gap: 10,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.danger,
      position: "absolute",
      top: 10,
      right: 10,
    },
    addButton: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: c.surface,
      fontSize: 13,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    section: {
      gap: 12,
    },
    cardList: {
      gap: 12,
    },
    goodCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 12,
      alignItems: "center",
    },
    goodIcon: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    goodTitle: {
      alignSelf: "stretch",
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    goodDescription: {
      alignSelf: "stretch",
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      alignItems: "center",
      gap: 12,
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
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
      alignSelf: "stretch",
    },
    emptyDescription: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
      alignSelf: "stretch",
    },
    emptyButton: {
      minWidth: 180,
      minHeight: 50,
      borderRadius: 16,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    emptyButtonText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: "700",
    },
  });
