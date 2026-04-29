import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, I18nManager, Platform, StyleSheet, Text, View, useColorScheme } from "react-native";

import { type ColorPalette } from "../src/constants/colors";
import { useI18n } from "../src/hooks/useI18n";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { onAuthStateChanged } from "../src/services/auth";
import { createUserProfile, getUserProfile } from "../src/services/firestore";
import { useAuthStore } from "../src/store/authStore";
import { useSettingsStore } from "../src/store/settingsStore";

export default function RootLayout() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hasHydrated = useSettingsStore((state) => state.hasHydrated === true);
  const theme = useSettingsStore((state) => state.theme);
  const syncFromProfile = useSettingsStore((state) => state.syncFromProfile);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const { language, t } = useI18n();
  const reloadingRef = useRef(false);
  const segments = useSegments();
  const systemScheme = useColorScheme();
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  useEffect(() => {
    if (!hasHydrated || Platform.OS === "web") {
      return;
    }

    const needsRTL = language === "he";
    if (I18nManager.isRTL !== needsRTL && !reloadingRef.current) {
      reloadingRef.current = true;
      I18nManager.allowRTL(needsRTL);
      I18nManager.forceRTL(needsRTL);
      Updates.reloadAsync().catch(() => {
        reloadingRef.current = false;
      });
    }
  }, [hasHydrated, language]);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(async (nextUser) => {
      if (!isActive) {
        return;
      }

      if (nextUser === null) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        let profile = await getUserProfile(nextUser.uid);

        if (profile === null && nextUser.email) {
          await createUserProfile(nextUser.uid, {
            email: nextUser.email,
            displayName: nextUser.displayName ?? "",
            language,
          });
          profile = await getUserProfile(nextUser.uid);
        }

        if (!isActive) {
          return;
        }

        setProfile(profile);
        if (profile) {
          syncFromProfile(profile);
        }
      } catch {
        if (!isActive) {
          return;
        }

        setProfile(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [language, setLoading, setProfile, setUser, syncFromProfile]);

  if (isLoading || !hasHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator color={colors.accent} size="small" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (user === null && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (inAuthGroup && user !== null) {
    return <Redirect href="/(tabs)" />;
  }

  const stackScreenOptions = {
    headerShown: false,
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontSize: 18, fontWeight: "600" as const },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  } as unknown as Parameters<typeof Stack>[0]["screenOptions"];

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack initialRouteName="(tabs)" screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="product/add" options={{ title: t("addProduct.title"), headerShown: true }} />
        <Stack.Screen name="product/[id]" options={{ title: t("productDetail.title"), headerShown: true }} />
        <Stack.Screen name="products" options={{ title: t("home.title"), headerShown: true }} />
      </Stack>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingScreen: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      color: c.textMuted,
      fontSize: 14,
    },
  });
