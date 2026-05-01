import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormField } from "../../src/components/FormField";
import { CATEGORY_LABEL_KEYS, CATEGORY_OPTIONS, type CategoryOption } from "../../src/constants/categories";
import { getCategoryIcon } from "../../src/constants/categoryIcons";
import { type ColorPalette } from "../../src/constants/colors";
import { IMPORTERS } from "../../src/constants/importers";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import { addProduct, updateProduct } from "../../src/services/products";
import { resolveReceiptUri } from "../../src/services/receiptStorage";
import { useAuthStore } from "../../src/store/authStore";
import type { ProductInput } from "../../src/types";
import { setCategoryPickerCallback } from "../../src/utils/categoryPickerCallback";
import { formatDateDisplay, formatWarrantyDuration } from "../../src/utils/warranty";

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
  const [category, setCategory] = useState<CategoryOption>("other");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [warrantyMonthsText, setWarrantyMonthsText] = useState("12");
  const [importer, setImporter] = useState("");
  const [importerPhone, setImporterPhone] = useState("");
  const [serial, setSerial] = useState("");
  const [imei, setImei] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCY_OPTIONS)[number]>("ILS");
  const [requiresInstallation, setRequiresInstallation] = useState(false);
  const [installationDate, setInstallationDate] = useState("");
  const [installerName, setInstallerName] = useState("");
  const [installationNotes, setInstallationNotes] = useState("");
  const [installLocalUri, setInstallLocalUri] = useState<string | null>(null);
  const [existingInstallUrl, setExistingInstallUrl] = useState<string | null>(null);
  const [originalInstallUrl, setOriginalInstallUrl] = useState<string | null>(null);
  const [receiptLocalUri, setReceiptLocalUri] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [originalReceiptUrl, setOriginalReceiptUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [statusKey, setStatusKey] = useState<TranslationKey | null>(null);
  const [formReady, setFormReady] = useState(!isEditMode);
  const [datePickerTarget, setDatePickerTarget] = useState<"purchase" | "installation" | null>(null);
  const [receiptPreviewVisible, setReceiptPreviewVisible] = useState(false);
  const [receiptPreviewUri, setReceiptPreviewUri] = useState<string | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState(() => new Date());
  const [pendingNavigation, setPendingNavigation] = useState<NavigationTarget | null>(null);
  const mountedRef = useRef(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setCategoryPickerCallback(null);
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
    setWarrantyMonthsText(String(existingProduct.warrantyMonths));
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
    setRequiresInstallation(existingProduct.requiresInstallation ?? false);
    setInstallationDate(existingProduct.installationDate ?? "");
    setInstallerName(existingProduct.installerName ?? "");
    setInstallationNotes(existingProduct.installationNotes ?? "");
    setExistingInstallUrl(existingProduct.installationImageUrl ?? null);
    setOriginalInstallUrl(existingProduct.installationImageUrl ?? null);
    setExistingReceiptUrl(existingProduct.receiptImageUrl ?? null);
    setOriginalReceiptUrl(existingProduct.receiptImageUrl ?? null);
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
  const selectedDisplayDate = purchaseDate ? formatDateDisplay(purchaseDate, language) : t("calendar.selectDate");
  const selectedCategoryLabel = t(CATEGORY_LABEL_KEYS[category]);
  const selectedCategoryIcon = getCategoryIcon(category);
  const resolvedExistingReceiptUri = resolveReceiptUri(existingReceiptUrl);
  const resolvedExistingInstallUri = resolveReceiptUri(existingInstallUrl);

  const openCalendar = (target: "purchase" | "installation") => {
    const current =
      target === "purchase"
        ? (purchaseDate && isValidDate(purchaseDate) ? parseIsoDate(purchaseDate) : new Date())
        : (installationDate && isValidDate(installationDate) ? parseIsoDate(installationDate) : new Date());
    setTempSelectedDate(current);
    setDatePickerTarget(target);
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

  const openCategoryPicker = () => {
    setCategoryPickerCallback((nextCategory) => {
      setCategory(nextCategory);
    });
    router.push(`/product/category-picker?selected=${encodeURIComponent(category)}`);
  };

  const clampWarrantyMonths = (value: number) => Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, value));

  const applyWarrantyMonths = (nextValue: number) => {
    const clampedValue = clampWarrantyMonths(nextValue);
    setWarrantyMonths(clampedValue);
    setWarrantyMonthsText(String(clampedValue));
  };

  const handleWarrantyInputChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 3);
    setWarrantyMonthsText(numericValue);
  };

  const commitWarrantyInput = () => {
    if (!warrantyMonthsText.trim()) {
      applyWarrantyMonths(MIN_MONTHS);
      return;
    }

    const parsed = Number.parseInt(warrantyMonthsText, 10);
    applyWarrantyMonths(Number.isNaN(parsed) ? MIN_MONTHS : parsed);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type !== "set") {
        setDatePickerTarget(null);
        return;
      }

      if (event.type === "set" && selectedDate) {
        if (datePickerTarget === "purchase") {
          setPurchaseDate(toIsoDate(selectedDate));
        } else if (datePickerTarget === "installation") {
          setInstallationDate(toIsoDate(selectedDate));
        }
        setStatusKey(null);
      }

      setDatePickerTarget(null);

      return;
    }

    if (selectedDate) {
      setTempSelectedDate(selectedDate);
    }
  };

  const confirmDateSelection = () => {
    const nextDate = toIsoDate(tempSelectedDate);

    if (datePickerTarget === "purchase") {
      setPurchaseDate(nextDate);
      setStatusKey(null);
    } else if (datePickerTarget === "installation") {
      setInstallationDate(nextDate);
      setStatusKey(null);
    }

    setDatePickerTarget(null);
  };

  const handlePickImage = async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (permission.status !== "granted" && permission.canAskAgain !== false) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== "granted") {
      setErrorKey("error.product.receiptPermissionDenied");

      if (permission.canAskAgain === false) {
        Alert.alert(t("common.error"), t("error.product.receiptPermissionDenied"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.openSettings"),
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]);
      }

      return;
    }

    setErrorKey(null);

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

  const handlePickInstallImage = async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (permission.status !== "granted" && permission.canAskAgain !== false) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== "granted") {
      setErrorKey("error.product.receiptPermissionDenied");

      if (permission.canAskAgain === false) {
        Alert.alert(t("common.error"), t("error.product.receiptPermissionDenied"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.openSettings"),
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]);
      }

      return;
    }

    setErrorKey(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setInstallLocalUri(result.assets[0].uri);
      setExistingInstallUrl(null);
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
      requiresInstallation,
      installationDate: requiresInstallation ? (installationDate.trim() || null) : null,
      installerName: requiresInstallation ? (installerName.trim() || null) : null,
      installationNotes: requiresInstallation ? (installationNotes.trim() || null) : null,
      installationImageUrl: null,
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
          updateProduct(
            uid,
            productId,
            input,
            receiptLocalUri ?? null,
            existingReceiptUrl ?? null,
            originalReceiptUrl ?? null,
            requiresInstallation ? installLocalUri ?? null : null,
            requiresInstallation ? existingInstallUrl ?? null : null,
            originalInstallUrl ?? null,
          ),
          15000,
          "updateProduct",
        );
        nextTarget = { pathname: "/product/[id]", params: { id: productId } };
      } else {
        await withTimeout(
          addProduct(
            uid,
            input,
            receiptLocalUri ?? null,
            requiresInstallation ? installLocalUri ?? null : null,
          ),
          15000,
          "addProduct",
        );
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
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.screenHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={styles.screenHeaderButton}
            >
              <Ionicons color={colors.text} name={isRTL ? "chevron-forward" : "chevron-back"} size={22} />
            </Pressable>
            <Text style={styles.screenHeaderTitle}>{isEditMode ? t("editProduct.title") : t("addProduct.title")}</Text>
            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                void handleSave();
              }}
              style={[styles.screenHeaderAction, isSubmitting && styles.inputDisabled]}
            >
              <Text style={styles.screenHeaderActionText}>{t("common.save")}</Text>
            </Pressable>
          </View>
          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionProductInfo")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.name")} required>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("addProduct.placeholder.name")}
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
                placeholder={t("addProduct.placeholder.brand")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={brand}
                onChangeText={setBrand}
              />
            </FormField>

            <FormField label={t("product.category")}>
              <Pressable
                disabled={isSubmitting}
                onPress={openCategoryPicker}
                style={[styles.categoryRow, { flexDirection: isRTL ? "row-reverse" : "row" }, isSubmitting && styles.inputDisabled]}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons color={colors.primary} name={selectedCategoryIcon} size={18} />
                </View>
                <Text style={[styles.categoryValue, { textAlign: isRTL ? "right" : "left" }]}>{selectedCategoryLabel}</Text>
                <Ionicons color={colors.textSubtle} name={isRTL ? "chevron-back" : "chevron-forward"} size={18} />
              </Pressable>
            </FormField>

            <View style={styles.divider} />
            <View style={[styles.toggleRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={styles.toggleTextBlock}>
                <Text style={[styles.toggleLabel, { textAlign: isRTL ? "right" : "left" }]}>
                  {t("addProduct.requiresInstallation")}
                </Text>
                <Text style={[styles.toggleHint, { textAlign: isRTL ? "right" : "left" }]}>
                  {t("addProduct.requiresInstallationHint")}
                </Text>
              </View>
              <Switch
                disabled={isSubmitting}
                onValueChange={setRequiresInstallation}
                thumbColor={colors.surface}
                trackColor={{ false: colors.border, true: colors.accent }}
                value={requiresInstallation}
              />
            </View>
          </View>

          {requiresInstallation ? (
            <>
              <SectionLabel isRTL={isRTL} title={t("addProduct.sectionInstallation")} />
              <View style={styles.sectionCard}>
                <FormField label={t("product.installationDate")}>
                  <Pressable
                    disabled={isSubmitting}
                    onPress={() => openCalendar("installation")}
                    style={[styles.dateField, isSubmitting && styles.inputDisabled]}
                  >
                    <View style={[styles.dateFieldContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                      <View style={[styles.dateFieldIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons color={colors.primary} name="calendar-outline" size={18} />
                      </View>
                      <View style={styles.dateFieldTextWrap}>
                        <Text
                          style={[
                            styles.dateFieldText,
                            !installationDate && styles.dateFieldPlaceholder,
                            { textAlign: isRTL ? "right" : "left" },
                          ]}
                        >
                          {installationDate
                            ? formatDateDisplay(installationDate, language)
                            : t("addProduct.datePlaceholder")}
                        </Text>
                      </View>
                      <Ionicons color={colors.textSubtle} name={isRTL ? "chevron-back" : "chevron-forward"} size={18} />
                    </View>
                  </Pressable>
                </FormField>

                <FormField label={t("product.installerName")}>
                  <TextInput
                    editable={!isSubmitting}
                    placeholder={t("addProduct.placeholder.installerName")}
                    placeholderTextColor={colors.textSubtle}
                    style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                    value={installerName}
                    onChangeText={setInstallerName}
                  />
                </FormField>

                <FormField label={t("product.installationNotes")}>
                  <TextInput
                    editable={!isSubmitting}
                    multiline
                    placeholder={t("addProduct.placeholder.installationNotes")}
                    placeholderTextColor={colors.textSubtle}
                    style={[...inputStyle, styles.notesInput, isSubmitting && styles.inputDisabled]}
                    textAlignVertical="top"
                    value={installationNotes}
                    onChangeText={setInstallationNotes}
                  />
                </FormField>

                <FormField label={t("product.installationCertificate")}>
                  {installLocalUri ? (
                    <View style={styles.receiptPreview}>
                      <Pressable
                        onPress={() => {
                          setReceiptPreviewUri(installLocalUri);
                          setReceiptPreviewVisible(true);
                        }}
                      >
                        <Image resizeMode="cover" source={{ uri: installLocalUri }} style={styles.receiptImage} />
                      </Pressable>
                      <Pressable onPress={() => setInstallLocalUri(null)} style={styles.removeReceiptBtn}>
                        <Text style={styles.removeReceiptText}>{t("product.installationCertificateRemove")}</Text>
                      </Pressable>
                    </View>
                  ) : resolvedExistingInstallUri ? (
                    <View style={styles.receiptPreview}>
                      <Pressable
                        onPress={() => {
                          setReceiptPreviewUri(resolvedExistingInstallUri);
                          setReceiptPreviewVisible(true);
                        }}
                      >
                        <Image resizeMode="cover" source={{ uri: resolvedExistingInstallUri }} style={styles.receiptImage} />
                      </Pressable>
                      <Pressable onPress={() => setExistingInstallUrl(null)} style={styles.removeReceiptBtn}>
                        <Text style={styles.removeReceiptText}>{t("product.installationCertificateRemove")}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      disabled={isSubmitting}
                      onPress={() => void handlePickInstallImage()}
                      style={styles.receiptPickerBtn}
                    >
                      <Text style={[styles.receiptPickerText, { textAlign: isRTL ? "right" : "left" }]}>
                        {t("product.installationCertificateAttach")}
                      </Text>
                    </Pressable>
                  )}
                </FormField>
              </View>
            </>
          ) : null}

          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionWarranty")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.purchaseDate")} required>
              <Pressable
                disabled={isSubmitting}
                onPress={() => openCalendar("purchase")}
                style={[styles.dateField, isSubmitting && styles.inputDisabled]}
              >
                <View style={[styles.dateFieldContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[styles.dateFieldIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons color={colors.primary} name="calendar-outline" size={18} />
                  </View>
                  <View style={styles.dateFieldTextWrap}>
                    <Text
                      style={[
                        styles.dateFieldText,
                        !purchaseDate && styles.dateFieldPlaceholder,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {selectedDisplayDate}
                    </Text>
                  </View>
                  <Ionicons color={colors.textSubtle} name={isRTL ? "chevron-back" : "chevron-forward"} size={18} />
                </View>
              </Pressable>
            </FormField>

            <FormField label={t("product.warrantyDuration")} required>
              <View style={[styles.stepper, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Pressable
                  disabled={isSubmitting || warrantyMonths <= MIN_MONTHS}
                  onPress={() => applyWarrantyMonths(warrantyMonths - 1)}
                  style={[styles.stepperBtn, warrantyMonths <= MIN_MONTHS && styles.stepperBtnDisabled]}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </Pressable>
                <TextInput
                  editable={!isSubmitting}
                  keyboardType="numeric"
                  maxLength={3}
                  selectTextOnFocus
                  style={[styles.stepperValueInput, isSubmitting && styles.inputDisabled]}
                  textAlign="center"
                  value={warrantyMonthsText}
                  onBlur={commitWarrantyInput}
                  onChangeText={handleWarrantyInputChange}
                  onSubmitEditing={commitWarrantyInput}
                />
                <Pressable
                  disabled={isSubmitting || warrantyMonths >= MAX_MONTHS}
                  onPress={() => applyWarrantyMonths(warrantyMonths + 1)}
                  style={[styles.stepperBtn, warrantyMonths >= MAX_MONTHS && styles.stepperBtnDisabled]}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
              <Text style={[styles.stepperHint, { textAlign: isRTL ? "right" : "left" }]}>
                {formatWarrantyDuration(warrantyMonths, language)}
              </Text>
            </FormField>

            {requiresInstallation && installationDate && installationDate > purchaseDate ? (
              <View style={[styles.infoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Ionicons color={colors.accent} name="information-circle-outline" size={14} />
                <Text style={[styles.infoRowText, { textAlign: isRTL ? "right" : "left" }]}>
                  {t("addProduct.warrantyFromInstallHint")}
                </Text>
              </View>
            ) : null}
          </View>

          <SectionLabel isRTL={isRTL} title={t("addProduct.sectionService")} />
          <View style={styles.sectionCard}>
            <FormField label={t("product.importer")}>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("addProduct.placeholder.importer")}
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
                placeholder={t("addProduct.placeholder.importerPhone")}
                placeholderTextColor={colors.textSubtle}
                style={[...inputStyle, isSubmitting && styles.inputDisabled]}
                value={importerPhone}
                onChangeText={setImporterPhone}
              />
            </FormField>

            <FormField label={t("product.serial")}>
              <TextInput
                editable={!isSubmitting}
                placeholder={t("addProduct.placeholder.serial")}
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
                placeholder={t("addProduct.placeholder.imei")}
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
                placeholder={t("addProduct.placeholder.notes")}
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
                  <Pressable
                    onPress={() => {
                      setReceiptPreviewUri(receiptLocalUri);
                      setReceiptPreviewVisible(true);
                    }}
                  >
                    <Image resizeMode="cover" source={{ uri: receiptLocalUri }} style={styles.receiptImage} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setReceiptLocalUri(null);
                    }}
                    style={styles.removeReceiptBtn}
                  >
                    <Text style={styles.removeReceiptText}>{t("product.receiptRemove")}</Text>
                  </Pressable>
                </View>
              ) : resolvedExistingReceiptUri ? (
                <View style={styles.receiptPreview}>
                  <Pressable
                    onPress={() => {
                      setReceiptPreviewUri(resolvedExistingReceiptUri);
                      setReceiptPreviewVisible(true);
                    }}
                  >
                    <Image resizeMode="cover" source={{ uri: resolvedExistingReceiptUri }} style={styles.receiptImage} />
                  </Pressable>
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

      {Platform.OS === "android" && datePickerTarget !== null ? (
        <DateTimePicker display="default" mode="date" value={tempSelectedDate} onChange={handleDateChange} />
      ) : null}

      <Modal animationType="fade" transparent visible={Platform.OS === "ios" && datePickerTarget !== null}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("calendar.selectDate")}</Text>
            <Text style={[styles.modalSubtitle, { textAlign: isRTL ? "right" : "left" }]}>
              {formatDateDisplay(toIsoDate(tempSelectedDate), language)}
            </Text>

            <DateTimePicker
              display="inline"
              mode="date"
              style={styles.iosDatePicker}
              themeVariant={colors.background === "#0f0f10" ? "dark" : "light"}
              value={tempSelectedDate}
              onChange={handleDateChange}
            />

            <View style={[styles.modalActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Pressable
                onPress={() => {
                  setDatePickerTarget(null);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>{t("calendar.cancel")}</Text>
              </Pressable>
              <Pressable onPress={confirmDateSelection} style={styles.primaryModalButton}>
                <Text style={styles.primaryModalButtonText}>{t("calendar.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={receiptPreviewVisible}>
        <View style={styles.receiptPreviewOverlay}>
          <Pressable
            onPress={() => {
              setReceiptPreviewVisible(false);
              setReceiptPreviewUri(null);
            }}
            style={[styles.receiptPreviewClose, { alignSelf: isRTL ? "flex-start" : "flex-end" }]}
          >
            <Text style={styles.receiptPreviewCloseText}>{t("common.cancel")}</Text>
          </Pressable>
          {receiptPreviewUri ? <Image resizeMode="contain" source={{ uri: receiptPreviewUri }} style={styles.receiptPreviewFullscreenImage} /> : null}
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
  screenHeaderRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  screenHeaderButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  screenHeaderTitle: {
    flex: 1,
    color: c.text,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontFamily: fontFamilies.bold,
    textAlign: "center",
  },
  screenHeaderAction: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  screenHeaderActionText: {
    color: c.primary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.semibold,
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
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontFamily: fontFamilies.semibold,
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
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
  },
  sectionLabel: {
    color: c.textSubtle,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontFamily: fontFamilies.semibold,
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
  divider: {
    height: 1,
    backgroundColor: c.border,
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
    minHeight: 56,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  dateFieldContent: {
    alignItems: "center",
    gap: 12,
  },
  dateFieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateFieldTextWrap: {
    flex: 1,
  },
  dateFieldText: {
    color: c.text,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
  },
  dateFieldPlaceholder: {
    color: c.textSubtle,
    fontFamily: fontFamilies.medium,
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
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontFamily: fontFamilies.bold,
    textAlign: "center",
  },
  stepperValue: {
    flex: 1,
    color: c.text,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
    textAlign: "center",
  },
  stepperValueInput: {
    minWidth: 72,
    minHeight: 44,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    backgroundColor: c.background,
    paddingHorizontal: 12,
    color: c.text,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
  },
  stepperHint: {
    color: c.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
    marginTop: 8,
  },
  toggleRow: {
    minHeight: 52,
    alignItems: "center",
    gap: 12,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    color: c.text,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.semibold,
  },
  toggleHint: {
    color: c.textSubtle,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontFamily: fontFamilies.regular,
  },
  infoRow: {
    alignItems: "flex-start",
    gap: 8,
  },
  infoRowText: {
    flex: 1,
    color: c.accent,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontFamily: fontFamilies.medium,
  },
  notesInput: {
    minHeight: 112,
    paddingTop: 14,
    paddingBottom: 14,
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
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.medium,
  },
  chipTextSelected: {
    color: c.surface,
  },
  categoryRow: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 12,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryValue: {
    flex: 1,
    color: c.text,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
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
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
  },
  receiptPreview: {
    gap: 10,
  },
  receiptImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  receiptPreviewOverlay: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 20,
    justifyContent: "center",
  },
  receiptPreviewClose: {
    position: "absolute",
    top: 56,
    left: 20,
    right: 20,
    zIndex: 1,
    paddingVertical: 8,
  },
  receiptPreviewCloseText: {
    color: "#ffffff",
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.bold,
  },
  receiptPreviewFullscreenImage: {
    width: "100%",
    height: "100%",
  },
  removeReceiptBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  removeReceiptText: {
    color: c.danger,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.semibold,
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
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
  },
  statusText: {
    color: c.accent,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
  },
  errorText: {
    color: c.danger,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
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
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: c.border,
    alignSelf: "center",
  },
  modalTitle: {
    color: c.text,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontFamily: fontFamilies.semibold,
  },
  modalSubtitle: {
    color: c.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
    marginTop: -8,
  },
  iosDatePicker: {
    alignSelf: "stretch",
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
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
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
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semibold,
  },
});
