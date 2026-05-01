import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORY_LABEL_KEYS, CATEGORY_OPTIONS, type CategoryOption } from "../../src/constants/categories";
import { getCategoryIcon } from "../../src/constants/categoryIcons";
import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { resolveCategoryPicker } from "../../src/utils/categoryPickerCallback";

export default function CategoryPickerScreen() {
  const { selected } = useLocalSearchParams<{ selected?: string }>();
  const { t, isRTL } = useI18n();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const selectedCategory = CATEGORY_OPTIONS.includes(selected as CategoryOption) ? (selected as CategoryOption) : "other";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        data={CATEGORY_OPTIONS}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <View style={[styles.headerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={styles.headerButton}
            >
              <Ionicons color={colors.text} name={isRTL ? "chevron-forward" : "chevron-back"} size={22} />
            </Pressable>
            <Text style={styles.headerTitle}>{t("addProduct.categoryPickerTitle")}</Text>
            <View style={styles.headerSpacer} />
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = item === selectedCategory;

          return (
            <Pressable
              onPress={() => {
                resolveCategoryPicker(item);
                router.back();
              }}
              style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons color={colors.primary} name={getCategoryIcon(item)} size={20} />
              </View>
              <Text style={[styles.rowLabel, { textAlign: isRTL ? "right" : "left" }]}>{t(CATEGORY_LABEL_KEYS[item])}</Text>
              {isSelected ? <Ionicons color={colors.primary} name="checkmark" size={20} /> : null}
            </Pressable>
          );
        }}
        style={styles.screen}
      />
    </>
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
      gap: 10,
    },
    headerRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 6,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontFamily: fontFamilies.bold,
      textAlign: "center",
    },
    row: {
      minHeight: 56,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    rowLabel: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
  });
