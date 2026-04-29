import { useEffect, useMemo, useRef, useState } from "react";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FormField } from "../../src/components/FormField";
import { type ColorPalette } from "../../src/constants/colors";
import { IMPORTERS } from "../../src/constants/importers";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import { addProduct, updateProduct } from "../../src/services/products";
import { useAuthStore } from "../../src/store/authStore";
import type { ProductInput } from "../../src/types";
import { formatDateDisplay, formatWarrantyDuration } from "../../src/utils/warranty";

const CATEGORY_OPTIONS = [
  "refrigerator",
  "tv",
  "washingMachine",
  "smartphone",
  "computer",
  "headphones",
  "ac",
  "dishwasher",
  "other",
] as const;

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

const CURRENCY_OPTIONS = ["ILS", "USD", "EUR"] as const;
const MIN_MONTHS = 1;
const MAX_MONTHS = 120;

function logSaveFlow(...args: unknown[]) {
  if (__DEV__) {
    console.log("[AddProduct]", ...args);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function buildCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function parseOptionalPrice(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value.trim());
  return Number.isNaN(parsed) ? null : parsed;
}

type NavigationTarget =
  | { pathname: "/(tabs)" }
  | { pathname: "/product/[id]"; params: { id: string } };

export default function AddProductScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditMode = Boolean(productId);
  const { t, isRTL, language } = useI18n();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const { products, isLoading: productsLoading } = useProducts();
  const existingProduct = isEditMode ? products.find((product) => product.id === productId) ?? null : null;
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>("other");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [importer, setImporter] = useState("");
  const [importerPhone, setImporterPhone] = useState("");
  const [serial, setSerial] = useState("");
  const [imei, setImei] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCY_OPTIONS)[number]>("ILS");
  const [receiptLocalUri, setReceiptLocalUri] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [statusKey, setStatusKey] = useState<TranslationKey | null>(null);
  const [formReady, setFormReady] = useState(!isEditMode);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [pendingNavigation, setPendingNavigation] = useState<NavigationTarget | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || formReady || !existingProduct) {
      return;
    }

    setName(existingProduct.name);
    setBrand(existingProduct.brand);
    setCategory(
      CATEGORY_OPTIONS.includes(existingProduct.category as (typeof CATEGORY_OPTIONS)[number])
        ? (existingProduct.category as (typeof CATEGORY_OPTIONS)[number])
        : "other",
    );
    setPurchaseDate(existingProduct.purchaseDate);
    setWarrantyMonths(existingProduct.warrantyMonths);
    setImporter(existingProduct.importer);
    setImporterPhone(existingProduct.importerPhone);
    setSerial(existingProduct.serial);
    setImei(existingProduct.imei ?? "");
    setNotes(existingProduct.notes);
    setPrice(existingProduct.price != null ? String(existingProduct.price) : "");
    setCurrency(
      CURRENCY_OPTIONS.includes(existingProduct.currency as (typeof CURRENCY_OPTIONS)[number])
        ? (existingProduct.currency as (typeof CURRENCY_OPTIONS)[number])
        : "ILS",
    );
    setExistingReceiptUrl(existingProduct.receiptImageUrl ?? null);
    setFormReady(true);
  }, [existingProduct, formReady, isEditMode]);

  useEffect(() => {
    if (isSubmitting || !pendingNavigation) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      try {
        router.replace(pendingNavigation as Href);
      } catch (error) {
        logSaveFlow("navigation failed", error);
      }

      setTimeout(() => {
        if (mountedRef.current) {
          logSaveFlow("component still mounted after navigation attempt");
        }
      }, 150);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isSubmitting, pendingNavigation]);

  const inputStyle = [styles.input, { textAlign: isRTL ? "right" : "left" }] as const;
  const monthNames = t("calendar.monthNames");
  const weekDaysShort = t("calendar.weekDaysShort");
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDisplayDate = purchaseDate ? formatDateDisplay(purchaseDate, language) : t("addProduct.datePlaceholder");

  const openCalendar = () => {
    const baseDate = purchaseDate && isValidDate(purchaseDate) ? parseIsoDate(purchaseDate) : new Date();
    setTempSelectedDate(toIsoDate(baseDate));
    setVisibleMonth(startOfMonth(baseDate));
    setIsCalendarVisible(true);
  };

  const handleImporterBlur = () => {
    if (!importer.trim() || importerPhone.trim()) {
      return;
    }

    const normalized = importer.trim().toLowerCase();
    const matchedKey = Object.keys(IMPORTERS).find((key) => key.includes(normalized) || normalized.includes(key));

    if (matchedKey) {
      setImporterPhone(IMPORTERS[matchedKey].phone);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorKey("error.product.receiptPermissionDenied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptLocalUri(result.assets[0].uri);
      setExistingReceiptUrl(null);
      setErrorKey(null);
      setStatusKey(null);
    }
  };

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    if (!name.trim()) {
      setErrorKey("error.product.nameRequired");
      return;
    }

    if (!purchaseDate.trim() || !isValidDate(purchaseDate.trim())) {
      setErrorKey("error.product.dateInvalid");
      return;
    }

    if (!uid) {
      setErrorKey("error.product.saveFailed");
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);
    setStatusKey(null);

    const input: Omit<ProductInput, "receiptImageUrl"> = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      serial: serial.trim(),
      imei: imei.trim(),
      purchaseDate: purchaseDate.trim(),
      warrantyMonths,
      importer: importer.trim(),
      importerPhone: importerPhone.trim(),
      notes: notes.trim(),
      price: parseOptionalPrice(price),
      currency,
      warrantyImageUrl: null,
    };

    let nextTarget: NavigationTarget | null = null;

    try {
      if (isEditMode && productId) {
        await withTimeout(
          updateProduct(uid, productId, input, receiptLocalUri ?? null, existingReceiptUrl ?? null),
          15000,
          "updateProduct",
        );
        nextTarget = { pathname: "/product/[id]", params: { id: productId } };
      } else {
        await withTimeout(addProduct(uid, input, receiptLocalUri ?? null), 15000, "addProduct");
        nextTarget = { pathname: "/(tabs)" };
      }
    } catch (error) {
      setErrorKey("error.product.saveFailed");
      console.error("[AddProduct] save failed", error);
    } finally {
      setIsSubmitting(false);

      if (nextTarget) {
        setStatusKey("common.savedSuccess");
        setPendingNavigation(nextTarget);
      } else {
        setPendingNavigation(null);
      }
    }
  };

  if (isEditMode && !formReady) {
    if (productsLoading) {
      return <LoadingScreen />;
    }

    if (!existingProduct) {
      return <NotFoundScreen />;
    }

    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ title: isEditMode ? t("editProduct.title") : t("addProduct.title") }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.description, { textAlign: isRTL ? "right" : "left" }]}>{t("addProduct.description")}</Text>

          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionProductInfo")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.name")} required>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("product.name")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setStatusKey(null);
                }}
              />
            </FormField>

            <FormField label={t("product.brand")}>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("product.brand")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={brand}
                onChangeText={setBrand}
              />
            </FormField>

            <FormField label={t("product.category")}>
              <View style={[styles.chipWrap, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                {CATEGORY_OPTIONS.map((option) => {
                  const selected = option === category;

                  return (
                    <Pressable
                      key={option}
                      disabled={isSubmitting}
                      onPress={() => setCategory(option)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(CATEGORY_LABEL_KEYS[option])}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FormField>
          </View>

          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionWarranty")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.purchaseDate")} required>
              <Pressable disabled={isSubmitting} onPress={openCalendar} style={[styles.dateField, isSubmitting && styles.inputDisabled]}>
                <Text
                  style={[
                    styles.dateFieldText,
                    !purchaseDate && styles.dateFieldPlaceholder,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {selectedDisplayDate}
                </Text>
              </Pressable>
            </FormField>

            <FormField label={t("product.warrantyDuration")} required>
              <View style={[styles.stepper, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Pressable
                  disabled={isSubmitting || warrantyMonths <= MIN_MONTHS}
                  onPress={() => setWarrantyMonths((current) => Math.max(MIN_MONTHS, current - 1))}
                  style={[styles.stepperBtn, warrantyMonths <= MIN_MONTHS && styles.stepperBtnDisabled]}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{formatWarrantyDuration(warrantyMonths, language)}</Text>
                <Pressable
                  disabled={isSubmitting || warrantyMonths >= MAX_MONTHS}
                  onPress={() => setWarrantyMonths((current) => Math.min(MAX_MONTHS, current + 1))}
                  style={[styles.stepperBtn, warrantyMonths >= MAX_MONTHS && styles.stepperBtnDisabled]}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </FormField>
          </View>

          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionService")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.importer")}>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("product.importer")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={importer}
                onBlur={handleImporterBlur}
                onChangeText={setImporter}
              />
            </FormField>

            <FormField label={t("product.importerPhone")}>
              <TextInput
                editable={!isSubmitting}
                keyboardType="phone-pad"
                placeholder={t("product.importerPhone")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={importerPhone}
                onChangeText={setImporterPhone}
              />
            </FormField>

            <FormField label={t("product.serial")}>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("product.serial")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={serial}
                onChangeText={setSerial}
              />
            </FormField>

            <FormField label={t("product.imei")}>
              <TextInput
                editable={!isSubmitting}
                keyboardType="numeric"
                placeholder={t("product.imei")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={imei}
                onChangeText={setImei}
              />
            </FormField>

            <FormField label={t("product.notes")}>
              <TextInput
                editable={!isSubmitting}
                multiline
                placeholder={t("product.notes")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, styles.notesInput, isSubmitting && styles.inputDisabled]}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </FormField>

            <FormField label={t("product.price")}>
              <View style={[styles.priceRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TextInput
                  editable={!isSubmitting}
                  keyboardType="decimal-pad"
                  placeholder={t("product.pricePlaceholder")}
                  placeholderTextColor={colors.textSubtle}
                  style={[styles.input, styles.priceInput, { textAlign: isRTL ? "right" : "left" }]}
                  value={price}
                  onChangeText={setPrice}
                />
                <View style={[styles.currencyWrap, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  {CURRENCY_OPTIONS.map((value) => {
                    const selected = value === currency;

                    return (
                      <Pressable
                        key={value}
                        disabled={isSubmitting}
                        onPress={() => setCurrency(value)}
                        style={[styles.chip, styles.currencyChip, selected && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </FormField>

            <FormField label={t("product.receipt")}>
              {receiptLocalUri ? (
                <View style={styles.receiptPreview}>
                  <Image resizeMode="cover" source={{ uri: receiptLocalUri }} style={styles.receiptImage} />
                  <Pressable
                    onPress={() => {
                      setReceiptLocalUri(null);
                    }}
                    style={styles.removeReceiptBtn}
                  >
                    <Text style={styles.removeReceiptText}>{t("product.receiptRemove")}</Text>
                  </Pressable>
                </View>
              ) : existingReceiptUrl ? (
                <View style={styles.receiptPreview}>
                  <Image resizeMode="cover" source={{ uri: existingReceiptUrl }} style={styles.receiptImage} />
                  <Pressable
                    onPress={() => {
                      setExistingReceiptUrl(null);
                    }}
                    style={styles.removeReceiptBtn}
                  >
                    <Text style={styles.removeReceiptText}>{t("product.receiptRemove")}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable disabled={isSubmitting} onPress={() => void handlePickImage()} style={styles.receiptPickerBtn}>
                  <Text style={[styles.receiptPickerText, { textAlign: isRTL ? "right" : "left" }]}>{t("product.receiptAttach")}</Text>
                </Pressable>
              )}
            </FormField>
          </View>

          <Pressable disabled={isSubmitting} onPress={() => void handleSave()} style={styles.saveButton}>
            {isSubmitting ? <ActivityIndicator color={colors.surface} size="small" /> : <Text style={styles.saveButtonText}>{isEditMode ? t("editProduct.save") : t("addProduct.save")}</Text>}
          </Pressable>

          {statusKey ? <Text style={[styles.statusText, { textAlign: isRTL ? "right" : "left" }]}>{t(statusKey)}</Text> : null}
          {errorKey ? <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>{t(errorKey)}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={isCalendarVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("calendar.selectDate")}</Text>

            <View style={[styles.monthHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Pressable onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>{t("calendar.previousMonth")}</Text>
              </Pressable>
              <Text style={styles.monthLabel}>
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </Text>
              <Pressable onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>{t("calendar.nextMonth")}</Text>
              </Pressable>
            </View>

            <View style={[styles.weekDaysRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {weekDaysShort.map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isoDate = toIsoDate(date);
                const selected = isoDate === tempSelectedDate;

                return (
                  <Pressable key={isoDate} onPress={() => setTempSelectedDate(isoDate)} style={[styles.dayCell, styles.dayButton, selected && styles.dayButtonSelected]}>
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{date.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.modalActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Pressable
                onPress={() => {
                  setIsCalendarVisible(false);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>{t("calendar.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (tempSelectedDate) {
                    setPurchaseDate(tempSelectedDate);
                    setStatusKey(null);
                  }
                  setIsCalendarVisible(false);
                }}
                style={styles.primaryModalButton}
              >
                <Text style={styles.primaryModalButtonText}>{t("calendar.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SectionLabel({ title, isRTL }: { title: string; isRTL: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{title}</Text>;
}

function LoadingScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.centerState}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

function NotFoundScreen() {
  const { t, isRTL } = useI18n();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.notFoundScreen}>
      <Text style={[styles.notFoundText, { textAlign: isRTL ? "right" : "left" }]}>{t("productDetail.notFound")}</Text>
      <Pressable
        onPress={() => {
          router.back();
        }}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>{t("common.back")}</Text>
      </Pressable>
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
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    backgroundColor: c.background,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundScreen: {
    flex: 1,
    backgroundColor: c.background,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  notFoundText: {
    color: c.text,
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: c.primary,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: c.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: c.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionLabel: {
    color: c.textSubtle,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    gap: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    color: c.text,
  },
  dateField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  dateFieldText: {
    color: c.text,
    fontSize: 14,
  },
  dateFieldPlaceholder: {
    color: c.textSubtle,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  stepper: {
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnText: {
    color: c.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stepperValue: {
    flex: 1,
    color: c.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  notesInput: {
    minHeight: 112,
    paddingTop: 14,
    paddingBottom: 14,
  },
  chipWrap: {
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  chipText: {
    color: c.text,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: c.surface,
  },
  priceRow: {
    alignItems: "flex-start",
    gap: 10,
  },
  priceInput: {
    flex: 1,
  },
  currencyWrap: {
    flexWrap: "wrap",
    gap: 8,
  },
  currencyChip: {
    minWidth: 56,
    alignItems: "center",
  },
  receiptPickerBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },
  receiptPickerText: {
    color: c.textMuted,
    fontSize: 14,
  },
  receiptPreview: {
    gap: 10,
  },
  receiptImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  removeReceiptBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  removeReceiptText: {
    color: c.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveButtonText: {
    color: c.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  statusText: {
    color: c.accent,
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: c.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 26, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: c.surface,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  modalTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: "700",
  },
  monthHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  monthButtonText: {
    color: c.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  monthLabel: {
    flex: 1,
    color: c.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  weekDaysRow: {
    justifyContent: "space-between",
  },
  weekDayText: {
    flex: 1,
    color: c.textSubtle,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButton: {
    borderRadius: 12,
  },
  dayButtonSelected: {
    backgroundColor: c.primary,
  },
  dayText: {
    color: c.text,
    fontSize: 14,
    fontWeight: "600",
  },
  dayTextSelected: {
    color: c.surface,
  },
  modalActions: {
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: c.text,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryModalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryModalButtonText: {
    color: c.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
