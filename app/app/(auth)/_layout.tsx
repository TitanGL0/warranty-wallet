import { Stack } from "expo-router";

import { colors } from "../../src/constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
