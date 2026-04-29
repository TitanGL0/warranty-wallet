import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ProductCard } from "../src/components/ProductCard";
import { type ColorPalette } from "../src/constants/colors";
import { useProducts } from "../src/hooks/useProducts";
import { useI18n } from "../src/hooks/useI18n";
import { useThemeColors } from "../src/hooks/useThemeColors";
import type { TranslationKey } from "../src/i18n/he";
import type { WarrantyStatus } from "../src/types";

type SortOption = "nameAsc" | "nameDesc" | "purchaseDateNewest" | "purchaseDateOldest" | "expiringSoonest";
type CompletenessFilter = "all" | "complete" | "incomplete";

const CATEGORY_LABEL_KEYS = {
  refrigerator: "category.refrigerator",
  tv: "category.tv",
  washingMachine: "category.washingMachine",
  smartphone: "category.smartphone",
  computer: "category.computer",
  headphones: "category.headphones",
  ac: "category.ac",
  dishwasher: "category.dishwasher",
  other: "category.other",
} as const;

const SORT_LABEL_KEYS: Record<
  SortOption,
  "products.sortNameAsc" | "products.sortNameDesc" | "products.sortNewest" | "products.sortOldest" | "products.sortExpiringSoonest"
> = {
  expiringSoonest: "products.sortExpiringSoonest",
  nameAsc: "products.sortNameAsc",
  nameDesc: "products.sortNameDesc",
  purchaseDateNewest: "products.sortNewest",
  purchaseDateOldest: "products.sortOldest",
};

const SORT_OPTIONS: SortOption[] = [
  "expiringSoonest",
  "nameAsc",
  "nameDesc",
  "purchaseDateNewest",
  "purchaseDateOldest",
];

const STATUS_OPTIONS: WarrantyStatus[] = ["valid", "expiringSoon", "expired"];
const COMPLETENESS_OPTIONS: CompletenessFilter[] = ["all", "complete", "incomplete"];

export default function ProductsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL, language } = useI18n();
  const { products, isLoading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("expiringSoonest");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<WarrantyStatus>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>("all");
  const [tempStatuses, setTempStatuses] = useState<Set<WarrantyStatus>>(new Set());
  const [tempCategories, setTempCategories] = useState<Set<string>>(new Set());
  const [tempCompleteness, setTempCompleteness] = useState<CompletenessFilter>("all");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        cats.add(product.category);
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  const activeFiltersCount =
    selectedStatuses.size + selectedCategories.size + (completenessFilter !== "all" ? 1 : 0);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        search.length === 0 ||
        [product.name, product.brand, product.serial, product.importer].join(" ").toLowerCase().includes(search);

      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(product.status);
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(product.category);

      const isComplete =
        Boolean(product.purchaseDate) &&
        (product.warrantyMonths > 0 || (product.warrantyYears ?? 0) > 0) &&
        Boolean(product.category) &&
        Boolean(product.receiptImageUrl) &&
        (Boolean(product.serial) || Boolean(product.imei));

      const matchesCompleteness =
        completenessFilter === "all" ? true : completenessFilter === "complete" ? isComplete : !isComplete;

      return matchesSearch && matchesStatus && matchesCategory && matchesCompleteness;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "purchaseDateNewest":
          return b.purchaseDate.localeCompare(a.purchaseDate);
        case "purchaseDateOldest":
          return a.purchaseDate.localeCompare(b.purchaseDate);
        case "expiringSoonest":
          return a.warrantyEnd.localeCompare(b.warrantyEnd);
        default:
          return 0;
      }
    });
  }, [products, query, selectedStatuses, selectedCategories, completenessFilter, sortBy]);

  const categoryLabel = (category: string): string =>
    category in CATEGORY_LABEL_KEYS
      ? t(CATEGORY_LABEL_KEYS[category as keyof typeof CATEGORY_LABEL_KEYS])
      : category;

  const completenessLabel = (value: CompletenessFilter) =>
    value === "complete"
      ? t("products.completenessComplete")
      : value === "incomplete"
        ? t("products.completenessIncomplete")
        : t("products.completenessAll");

  const toggleTempStatus = (status: WarrantyStatus) => {
    setTempStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleTempCategory = (category: string) => {
    setTempCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const openFilterModal = () => {
    setTempStatuses(new Set(selectedStatuses));
    setTempCategories(new Set(selectedCategories));
    setTempCompleteness(completenessFilter);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedStatuses(new Set(tempStatuses));
    setSelectedCategories(new Set(tempCategories));
    setCompletenessFilter(tempCompleteness);
    setFilterModalVisible(false);
  };

  const resetTempFilters = () => {
    setTempStatuses(new Set());
    setTempCategories(new Set());
    setTempCompleteness("all");
  };

  const resetAllFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedCategories(new Set());
    setCompletenessFilter("all");
    setQuery("");
  };

  const removeStatusFilter = (status: WarrantyStatus) => {
    setSelectedStatuses((current) => {
      const next = new Set(current);
      next.delete(status);
      return next;
    });
  };

  const removeCategoryFilter = (category: string) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      next.delete(category);
      return next;
    });
  };

  const renderEmptyState = () => {
    if (products.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.accent} name="document-text-outline" size={32} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("home.empty.title")}</Text>
          <Text style={[styles.emptyDescription, { textAlign: isRTL ? "right" : "left" }]}>{t("home.empty.description")}</Text>
          <Link asChild href="/product/add">
            <Pressable style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>{t("home.addProduct")}</Text>
            </Pressable>
          </Link>
        </View>
      );
    }

    return (
      <View style={styles.filterEmptyState}>
        <Ionicons color={colors.textSubtle} name="search-outline" size={36} />
        <Text style={[styles.filterEmptyTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("products.noResults")}</Text>
        <Text style={[styles.filterEmptyDesc, { textAlign: isRTL ? "right" : "left" }]}>{t("products.noResultsDesc")}</Text>
        <Pressable onPress={resetAllFilters} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>{t("products.resetFilters")}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t("home.title") }} />
      <View style={styles.screen}>
        <View style={[styles.searchShell, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Ionicons color={colors.textSubtle} name="search-outline" size={18} />
          <TextInput
            placeholder={t("home.search.placeholder")}
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={[styles.controlsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable onPress={() => setSortModalVisible(true)} style={[styles.controlButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Ionicons color={colors.textMuted} name="funnel-outline" size={15} />
            <Text style={styles.controlButtonText}>{t("products.sortBy")}</Text>
            <View style={styles.controlDivider} />
            <Text numberOfLines={1} style={styles.controlValueText}>{t(SORT_LABEL_KEYS[sortBy])}</Text>
          </Pressable>

          <Pressable onPress={openFilterModal} style={[styles.controlButton, styles.filterButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.filterIconWrap}>
              <Ionicons color={colors.textMuted} name="options-outline" size={15} />
              {activeFiltersCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.controlButtonText}>{t("products.filters")}</Text>
          </Pressable>
        </View>

        {activeFiltersCount > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeChipsScroll}
            contentContainerStyle={[styles.activeChipsContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            {Array.from(selectedStatuses).map((status) => (
              <Pressable
                key={status}
                onPress={() => removeStatusFilter(status)}
                style={[styles.activeChip, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.activeChipText}>
                  {t(`warranty.status.${status}` as TranslationKey)}
                </Text>
                <Ionicons color={colors.primary} name="close" size={12} style={styles.activeChipIcon} />
              </Pressable>
            ))}
            {Array.from(selectedCategories).map((category) => (
              <Pressable
                key={category}
                onPress={() => removeCategoryFilter(category)}
                style={[styles.activeChip, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.activeChipText}>
                  {categoryLabel(category)}
                </Text>
                <Ionicons color={colors.primary} name="close" size={12} style={styles.activeChipIcon} />
              </Pressable>
            ))}
            {completenessFilter !== "all" ? (
              <Pressable
                onPress={() => setCompletenessFilter("all")}
                style={[styles.activeChip, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.activeChipText}>
                  {completenessLabel(completenessFilter)}
                </Text>
                <Ionicons color={colors.primary} name="close" size={12} style={styles.activeChipIcon} />
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>{t(error as TranslationKey)}</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  language={language}
                  product={item}
                  onPress={() => {
                    router.push(`/product/${item.id}`);
                  }}
                />
              )}
            />
          )}
        </View>

        <Pressable
          onPress={() => {
            router.push("/product/add");
          }}
          style={styles.fab}
        >
          <Text style={styles.fabText}>{t("home.addProduct")}</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={sortModalVisible}
      >
        <Pressable onPress={() => setSortModalVisible(false)} style={styles.modalOverlay}>
          <Pressable onPress={() => {}} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("products.sortBy")}</Text>
            <View style={styles.modalList}>
              {SORT_OPTIONS.map((option) => {
                const selected = option === sortBy;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSortBy(option);
                      setSortModalVisible(false);
                    }}
                    style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  >
                    <Ionicons
                      color={selected ? colors.primary : colors.border}
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                    />
                    <Text style={[styles.optionText, { textAlign: isRTL ? "right" : "left" }]}>{t(SORT_LABEL_KEYS[option])}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={filterModalVisible}
      >
        <Pressable onPress={() => setFilterModalVisible(false)} style={styles.modalOverlay}>
          <Pressable onPress={() => {}} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[styles.modalTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("products.filtersTitle")}</Text>
              <Pressable onPress={resetTempFilters}>
                <Text style={styles.resetText}>{t("products.resetFilters")}</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("products.filterStatus")}</Text>
              <View style={[styles.modalChipsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                {STATUS_OPTIONS.map((status) => {
                  const selected = tempStatuses.has(status);
                  return (
                    <Pressable
                      key={status}
                      onPress={() => toggleTempStatus(status)}
                      style={[styles.modalChip, selected && styles.modalChipSelected]}
                    >
                      <Text style={[styles.modalChipText, selected && styles.modalChipTextSelected]}>
                        {t(`warranty.status.${status}` as TranslationKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {availableCategories.length > 0 ? (
                <>
                  <Text style={[styles.modalSectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("products.filterCategory")}</Text>
                  <View style={[styles.modalChipsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    {availableCategories.map((category) => {
                      const selected = tempCategories.has(category);
                      return (
                        <Pressable
                          key={category}
                          onPress={() => toggleTempCategory(category)}
                          style={[styles.modalChip, selected && styles.modalChipSelected]}
                        >
                          <Text style={[styles.modalChipText, selected && styles.modalChipTextSelected]}>{categoryLabel(category)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Text style={[styles.modalSectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("products.filterCompleteness")}</Text>
              <View style={styles.modalList}>
                {COMPLETENESS_OPTIONS.map((option) => {
                  const selected = option === tempCompleteness;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setTempCompleteness(option)}
                      style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    >
                      <Ionicons
                        color={selected ? colors.primary : colors.border}
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={18}
                      />
                      <Text style={[styles.optionText, { textAlign: isRTL ? "right" : "left" }]}>{completenessLabel(option)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable onPress={applyFilters} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>{t("products.applyFilters")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 14,
    },
    searchShell: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      alignItems: "center",
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: c.text,
      fontSize: 14,
    },
    controlsRow: {
      gap: 10,
    },
    controlButton: {
      flex: 1,
      minHeight: 44,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 9,
      alignItems: "center",
      gap: 6,
    },
    filterButton: {
      justifyContent: "center",
    },
    controlButtonText: {
      color: c.text,
      fontSize: 13,
      fontWeight: "600",
    },
    controlDivider: {
      width: 1,
      height: 14,
      backgroundColor: c.border,
    },
    controlValueText: {
      flex: 1,
      color: c.textMuted,
      fontSize: 12,
    },
    filterIconWrap: {
      position: "relative",
      width: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadge: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadgeText: {
      color: c.surface,
      fontSize: 10,
      fontWeight: "700",
    },
    activeChipsScroll: {
      maxHeight: 40,
    },
    activeChipsContent: {
      alignItems: "center",
      gap: 8,
    },
    activeChip: {
      backgroundColor: c.primarySoft,
      borderRadius: 999,
      minHeight: 32,
      maxWidth: 220,
      paddingHorizontal: 12,
      paddingVertical: 5,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    activeChipText: {
      color: c.primary,
      fontSize: 12,
      fontWeight: "600",
      flexShrink: 1,
    },
    activeChipIcon: {
      flexShrink: 0,
    },
    content: {
      flex: 1,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    listContent: {
      gap: 12,
      paddingBottom: 96,
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
    filterEmptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
    },
    filterEmptyTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: "700",
    },
    filterEmptyDesc: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    resetButton: {
      backgroundColor: c.primarySoft,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    resetButtonText: {
      color: c.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    errorText: {
      color: c.danger,
      fontSize: 14,
      lineHeight: 22,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      backgroundColor: c.primary,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 14,
      alignSelf: "center",
    },
    fabText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 32,
      paddingTop: 12,
      gap: 20,
      maxHeight: "85%",
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: "center",
      marginBottom: 4,
    },
    modalTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    modalList: {
      gap: 4,
    },
    optionRow: {
      minHeight: 48,
      alignItems: "center",
      gap: 12,
    },
    optionText: {
      flex: 1,
      color: c.text,
      fontSize: 14,
    },
    modalHeaderRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    resetText: {
      color: c.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    modalScroll: {
      maxHeight: 420,
    },
    modalScrollContent: {
      gap: 18,
      paddingBottom: 8,
    },
    modalSectionLabel: {
      color: c.textSubtle,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    modalChipsRow: {
      flexWrap: "wrap",
      gap: 8,
    },
    modalChip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    modalChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    modalChipText: {
      color: c.text,
      fontSize: 13,
      fontWeight: "600",
    },
    modalChipTextSelected: {
      color: c.surface,
    },
    applyButton: {
      minHeight: 50,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    applyButtonText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: "700",
    },
  });
