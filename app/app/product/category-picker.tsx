import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_LABEL_KEYS, CATEGORY_OPTIONS, type CategoryOption } from "../../src/constants/categories";
import { getCategoryIcon } from "../../src/constants/categoryIcons";
import { type ColorPalette } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { resolveCategoryPicker } from "../../src/utils/categoryPickerCallback";

export default function CategoryPickerScreen() {
  const { selected } = useLocalSearchParams<{ selected?: string }>();
  const { t, isRTL } = useI18n();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectedCategory = CATEGORY_OPTIONS.includes(selected as CategoryOption) ? (selected as CategoryOption) : "other";

  return (
    <>
      <Stack.Screen options={{ title: t("addProduct.categoryPickerTitle"), headerShown: true }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={CATEGORY_OPTIONS}
        keyExtractor={(item) => item}
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
      marginBottom: 10,
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
      fontSize: 15,
      fontWeight: "600",
    },
  });
