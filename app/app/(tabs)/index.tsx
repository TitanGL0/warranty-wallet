import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { router, Tabs } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DashboardProductCard } from "../../src/components/DashboardProductCard";
import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights, radii } from "../../src/constants/typography";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useAuthStore } from "../../src/store/authStore";

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { products, isLoading } = useProducts();
  const { t, isRTL, language } = useI18n();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const firstName = (profile?.displayName || user?.displayName || "").split(" ")[0];
  const greetingText = firstName ? `${t("home.greeting")}, ${firstName}` : t("home.greetingGeneric");
  const expiringSoon = useMemo(() => products.filter((product) => product.status === "expiringSoon"), [products]);
  const expired = useMemo(() => products.filter((product) => product.status === "expired"), [products]);
  const recentProducts = useMemo(() => products.slice(0, 3), [products]);
  const hasProducts = products.length > 0;

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <Tabs.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <Tabs.Screen options={{ headerShown: false }} />
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

      {hasProducts ? (
        <View style={[styles.statsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <DashboardStatCard icon="checkmark-circle" iconColor={colors.accent} label={t("home.stats.total")} value={products.length} />
          <DashboardStatCard icon="alert-circle" iconColor={colors.warning} label={t("home.stats.expiringSoon")} value={expiringSoon.length} />
          <DashboardStatCard icon="close-circle" iconColor={colors.danger} label={t("home.stats.expired")} value={expired.length} />
        </View>
      ) : null}

      {!isLoading && hasProducts ? (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[styles.sectionHeaderTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("home.recentlyAdded")}
            </Text>
            <Pressable
              onPress={() => {
                router.push("/products");
              }}
              style={styles.sectionHeaderActionWrap}
            >
              <Text style={[styles.sectionHeaderAction, { textAlign: isRTL ? "left" : "right" }]}>
                {t("home.viewAll")}
              </Text>
            </Pressable>
          </View>
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

      {!hasProducts ? (
        <View style={styles.emptyStateWrap}>
          <View style={styles.emptyStateIcon}>
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={42} />
          </View>
          <Text style={styles.emptyStateTitle}>{t("home.empty.title")}</Text>
          <Text style={styles.emptyStateDescription}>{t("home.empty.description")}</Text>
          <Pressable
            onPress={() => {
              router.push("/product/add");
            }}
            style={styles.emptyStateButton}
          >
            <Text style={styles.emptyStateButtonText}>{t("home.addProduct")}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[styles.sectionHeaderTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("home.expiringSoon")}
            </Text>
          </View>

          {expiringSoon.length > 0 ? (
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
      )}
    </ScrollView>
  );
}

function DashboardStatCard({
  value,
  label,
  icon,
  iconColor,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const iconBorderColor = `${iconColor}26`;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: colors.background, borderColor: iconBorderColor }]}>
        <Ionicons color={iconColor} name={icon} size={22} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 16,
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
      gap: 0,
    },
    greeting: {
      color: c.text,
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontFamily: fontFamilies.bold,
    },
    greetingSubtitle: {
      marginTop: 4,
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    greetingActions: {
      alignItems: "center",
      gap: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
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
      borderRadius: radii.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: c.surface,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radii.xl,
      padding: 12,
      alignItems: "center",
      gap: 4,
    },
    statIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.lg,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    statValue: {
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontFamily: fontFamilies.bold,
      color: c.text,
    },
    statLabel: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "center",
      color: c.textMuted,
    },
    sectionHeaderRow: {
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionHeaderTitle: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontFamily: fontFamilies.semibold,
    },
    sectionHeaderActionWrap: {
      paddingVertical: 4,
    },
    sectionHeaderAction: {
      color: c.primary,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.semibold,
    },
    section: {
      gap: 8,
    },
    cardList: {
      gap: 12,
    },
    emptyStateWrap: {
      minHeight: 360,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingHorizontal: 24,
    },
    emptyStateIcon: {
      width: 88,
      height: 88,
      borderRadius: 30,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyStateTitle: {
      color: c.text,
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontFamily: fontFamilies.bold,
      textAlign: "center",
    },
    emptyStateDescription: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
      textAlign: "center",
      maxWidth: 320,
    },
    emptyStateButton: {
      minHeight: 48,
      borderRadius: radii.lg,
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    emptyStateButtonText: {
      color: c.surface,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    goodCard: {
      backgroundColor: c.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 12,
      alignItems: "center",
    },
    goodIcon: {
      width: 64,
      height: 64,
      borderRadius: radii.lg,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    goodTitle: {
      alignSelf: "stretch",
      color: c.text,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontFamily: fontFamilies.semibold,
    },
    goodDescription: {
      alignSelf: "stretch",
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
  });
