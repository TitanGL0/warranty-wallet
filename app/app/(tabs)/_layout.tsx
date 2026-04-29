import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";

export default function TabsLayout() {
  const { t, isRTL } = useI18n();
  const colors = useThemeColors();

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
        headerTitleStyle: { fontSize: 18 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {isRTL ? settingsScreen : homeScreen}
      {alertsScreen}
      {isRTL ? homeScreen : settingsScreen}
    </Tabs>
  );
}
