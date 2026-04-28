import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { ActivityIndicator, I18nManager, Platform, StyleSheet, Text, View } from "react-native";

import { colors } from "../src/constants/colors";
import { useI18n } from "../src/hooks/useI18n";
import { onAuthStateChanged } from "../src/services/auth";
import { createUserProfile, getUserProfile } from "../src/services/firestore";
import { useAuthStore } from "../src/store/authStore";
import { useSettingsStore } from "../src/store/settingsStore";

export default function RootLayout() {
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const syncFromProfile = useSettingsStore((state) => state.syncFromProfile);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const { language, isRTL, t } = useI18n();
  const reloadingRef = useRef(false);
  const segments = useSegments();

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
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.accent} size="small" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (user === null && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (inAuthGroup) {
    if (user !== null) {
      return <Redirect href="/(tabs)" />;
    }
  }

  const rootDirectionStyle = {
    direction: isRTL ? "rtl" : "ltr",
    writingDirection: isRTL ? "rtl" : "ltr",
  } as never;

  return (
    <View style={[styles.root, rootDirectionStyle]}>
      <StatusBar style="dark" />
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 18, fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="product/add" options={{ title: t("addProduct.title") }} />
        <Stack.Screen name="product/[id]" options={{ title: t("productDetail.title") }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
