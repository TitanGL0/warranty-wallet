import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";

export default function TabsLayout() {
  const { t, isRTL } = useI18n();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const homeScreen = (
    <Tabs.Screen
      name="index"
      options={{
        title: t("home.dashboardTitle"),
        tabBarLabel: t("tabs.home"),
        tabBarIcon: ({ color, size, focused }) => <Ionicons color={color} name={focused ? "home" : "home-outline"} size={size} />,
      }}
    />
  );

  const alertsScreen = (
    <Tabs.Screen
      name="alerts"
      options={{
        title: t("alerts.title"),
        tabBarLabel: t("tabs.alerts"),
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons color={color} name={focused ? "notifications" : "notifications-outline"} size={size} />
        ),
      }}
    />
  );

  const settingsScreen = (
    <Tabs.Screen
      name="settings"
      options={{
        title: t("settings.title"),
        tabBarLabel: t("tabs.settings"),
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons color={color} name={focused ? "settings" : "settings-outline"} size={size} />
        ),
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: fontSizes.lg,
          lineHeight: lineHeights.lg,
          fontFamily: fontFamilies.semibold,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: fontSizes.xs,
          lineHeight: 14,
          fontFamily: fontFamilies.semibold,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      {isRTL ? settingsScreen : homeScreen}
      {alertsScreen}
      {isRTL ? homeScreen : settingsScreen}
    </Tabs>
  );
}
