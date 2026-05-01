import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WarrantyBadge } from "../../src/components/WarrantyBadge";
import { getCategoryIcon } from "../../src/constants/categoryIcons";
import { type ColorPalette } from "../../src/constants/colors";
import { fontFamilies, fontSizes, lineHeights } from "../../src/constants/typography";
import { IMPORTERS } from "../../src/constants/importers";
import { useProducts } from "../../src/hooks/useProducts";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { TranslationKey } from "../../src/i18n/he";
import { deleteProduct } from "../../src/services/products";
import { resolveReceiptUri } from "../../src/services/receiptStorage";
import { useAuthStore } from "../../src/store/authStore";
import { formatDateDisplay, formatWarrantyDuration, getDaysLeft } from "../../src/utils/warranty";

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

function formatPrice(price: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "\u20ac" : "\u20aa";

  return `${symbol} ${price}`;
}

export default function ProductDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const { products, isLoading } = useProducts();
  const { t, isRTL, language } = useI18n();
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [receiptPreviewVisible, setReceiptPreviewVisible] = useState(false);
  const [receiptPreviewUri, setReceiptPreviewUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const product = products.find((item) => item.id === id);
  const importerEntry = useMemo(() => {
    if (!product?.importer) {
      return null;
    }

    const normalized = product.importer.toLowerCase();
    const matchedKey = Object.keys(IMPORTERS).find((key) => key.includes(normalized) || normalized.includes(key));

    return matchedKey ? IMPORTERS[matchedKey] : null;
  }, [product?.importer]);

  const handleDelete = () => {
    if (!uid || !id) {
      setErrorKey("error.product.deleteFailed");
      return;
    }

    Alert.alert(t("productDetail.deleteConfirmTitle"), t("productDetail.deleteConfirmMessage"), [
      { style: "cancel", text: t("common.cancel") },
      {
        style: "destructive",
        text: t("productDetail.deleteConfirm"),
        onPress: () => {
          void (async () => {
            try {
              setIsDeleting(true);
              setErrorKey(null);
              await deleteProduct(uid, id, product?.receiptImageUrl, product?.installationImageUrl);
              router.back();
            } catch {
              setErrorKey("error.product.deleteFailed");
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (id) {
      router.push(`/product/add?productId=${id}`);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.loadingScreen, { paddingTop: insets.top + 16 }]}>
          <View style={[styles.screenHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={styles.screenHeaderButton}
            >
              <Ionicons color={colors.text} name={isRTL ? "chevron-forward" : "chevron-back"} size={22} />
            </Pressable>
            <Text style={styles.screenHeaderTitle}>{t("productDetail.title")}</Text>
            <View style={styles.screenHeaderSpacer} />
          </View>
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        </View>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.notFoundScreen, { paddingTop: insets.top + 16 }]}>
          <View style={[styles.screenHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={styles.screenHeaderButton}
            >
              <Ionicons color={colors.text} name={isRTL ? "chevron-forward" : "chevron-back"} size={22} />
            </Pressable>
            <Text style={styles.screenHeaderTitle}>{t("productDetail.title")}</Text>
            <View style={styles.screenHeaderSpacer} />
          </View>
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
      </>
    );
  }

  const daysLeft = getDaysLeft(product.warrantyEnd);
  const categoryLabel =
    product.category && product.category in CATEGORY_LABEL_KEYS
      ? t(CATEGORY_LABEL_KEYS[product.category as keyof typeof CATEGORY_LABEL_KEYS])
      : "";
  const categoryIcon = getCategoryIcon(product.category);
  const resolvedReceiptUri = resolveReceiptUri(product.receiptImageUrl);
  const resolvedInstallUri = resolveReceiptUri(product.installationImageUrl);
  const hasInstallationDetails = Boolean(product.installationDate || product.installerName || product.installationNotes);
  const documentItems = [
    resolvedReceiptUri
      ? {
          key: "receipt",
          label: t("product.receipt"),
          uri: resolvedReceiptUri,
        }
      : null,
    resolvedInstallUri
      ? {
          key: "installation",
          label: t("product.installationCertificate"),
          uri: resolvedInstallUri,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; uri: string }>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        style={styles.screen}
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
          <Text style={styles.screenHeaderTitle}>{t("productDetail.title")}</Text>
          <View style={styles.screenHeaderSpacer} />
        </View>
        <View style={styles.headerCard}>
          <View style={[styles.headerTop, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.headerIcon}>
              <Ionicons color={colors.accent} name={categoryIcon} size={28} />
            </View>
            <Text numberOfLines={2} style={[styles.title, { flex: 1, textAlign: isRTL ? "right" : "left" }]}>
              {product.name}
            </Text>
            <WarrantyBadge daysLeft={daysLeft} status={product.status} />
          </View>
          <View style={styles.metaRows}>
            <DetailRow icon="calendar-outline" isRTL={isRTL} label={t("productDetail.purchasedOn")} value={formatDateDisplay(product.purchaseDate, language)} />
            <DetailRow icon="shield-checkmark-outline" isRTL={isRTL} label={t("productDetail.warrantyUntil")} value={formatDateDisplay(product.warrantyEnd, language)} />
          </View>
        </View>

        {product.brand || categoryLabel || product.price != null ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("addProduct.sectionProductInfo")} />
            <View style={styles.sectionCard}>
              {product.brand ? <DetailRow icon="storefront-outline" isRTL={isRTL} label={t("product.brand")} value={product.brand} /> : null}
              {categoryLabel ? <DetailRow icon="grid-outline" isRTL={isRTL} label={t("product.category")} value={categoryLabel} /> : null}
              {product.price != null ? <DetailRow icon="cash-outline" isRTL={isRTL} label={t("product.price")} value={formatPrice(product.price, product.currency)} /> : null}
            </View>
          </>
        ) : null}

        <>
          <SectionLabel isRTL={isRTL} label={t("addProduct.sectionWarranty")} />
          <View style={styles.sectionCard}>
            <DetailRow icon="timer-outline" isRTL={isRTL} label={t("product.warrantyDuration")} value={formatWarrantyDuration(product.warrantyMonths, language)} />
            {product.warrantyStartDate !== product.purchaseDate ? (
              <DetailRow
                icon="shield-checkmark-outline"
                isRTL={isRTL}
                label={t("productDetail.warrantyFrom")}
                value={formatDateDisplay(product.warrantyStartDate, language)}
              />
            ) : null}
          </View>
        </>

        {product.requiresInstallation && hasInstallationDetails ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("productDetail.installationSection")} />
            <View style={styles.sectionCard}>
              {product.installationDate ? (
                <DetailRow
                  icon="calendar-outline"
                  isRTL={isRTL}
                  label={t("productDetail.installedOn")}
                  value={formatDateDisplay(product.installationDate, language)}
                />
              ) : null}
              {product.installerName ? (
                <DetailRow
                  icon="person-outline"
                  isRTL={isRTL}
                  label={t("product.installerName")}
                  value={product.installerName}
                />
              ) : null}
              {product.installationNotes ? (
                <DetailRow
                  icon="document-text-outline"
                  isRTL={isRTL}
                  label={t("product.installationNotes")}
                  value={product.installationNotes}
                />
              ) : null}
              {product.installationDate && product.installationDate > product.purchaseDate ? (
                <View style={[styles.infoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Ionicons color={colors.accent} name="information-circle-outline" size={14} />
                  <Text style={[styles.infoRowText, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("productDetail.warrantyFromInstallNote")}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {product.serial || product.imei ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("product.serial")} />
            <View style={styles.sectionCard}>
              {product.serial ? <DetailRow icon="barcode-outline" isRTL={isRTL} label={t("product.serial")} value={product.serial} /> : null}
              {product.imei ? <DetailRow icon="phone-portrait-outline" isRTL={isRTL} label={t("product.imei")} value={product.imei} /> : null}
            </View>
          </>
        ) : null}

        {importerEntry ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("productDetail.serviceInfo")} />
            <View style={styles.serviceCard}>
              <View style={[styles.serviceRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Ionicons color={colors.accent} name="business-outline" size={18} />
                <Text style={[styles.serviceName, { textAlign: isRTL ? "right" : "left" }]}>{importerEntry.name}</Text>
              </View>
              <Pressable
                onPress={() => {
                  void Linking.openURL(`tel:${importerEntry.phone}`);
                }}
              >
                <View style={[styles.servicePhoneRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[styles.serviceRow, styles.servicePhoneLabelGroup, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Ionicons color={colors.accent} name="call-outline" size={18} />
                    <Text style={[styles.detailLabel, styles.servicePhoneLabel, { textAlign: isRTL ? "right" : "left" }]}>
                      {t("product.importerPhone")}
                    </Text>
                  </View>
                  <View style={[styles.servicePhonePill, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Ionicons color={colors.primary} name="call-outline" size={14} />
                    <Text style={[styles.servicePhonePillText, { textAlign: isRTL ? "left" : "right" }]}>{importerEntry.phone}</Text>
                  </View>
                </View>
              </Pressable>
              {importerEntry.hours ? (
                <Text style={[styles.serviceHours, { textAlign: isRTL ? "right" : "left" }]}>{importerEntry.hours}</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {product.importer && !importerEntry ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("addProduct.sectionService")} />
            <View style={styles.sectionCard}>
              <DetailRow icon="business-outline" isRTL={isRTL} label={t("product.importer")} value={product.importer} />
              {product.importerPhone ? (
                <DetailRow
                  icon="call-outline"
                  isRTL={isRTL}
                  label={t("product.importerPhone")}
                  onPress={() => {
                    void Linking.openURL(`tel:${product.importerPhone}`);
                  }}
                  value={product.importerPhone}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {product.notes ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("product.notes")} />
            <View style={styles.sectionCard}>
              <View style={[styles.notesRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Ionicons color={colors.textSubtle} name="document-text-outline" size={16} style={styles.notesIcon} />
                <Text style={[styles.notesText, { textAlign: isRTL ? "right" : "left" }]}>{product.notes}</Text>
              </View>
            </View>
          </>
        ) : null}

        {documentItems.length > 0 ? (
          <>
            <SectionLabel isRTL={isRTL} label={t("productDetail.documentsSection")} />
            <View style={[styles.documentsGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {documentItems.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    setReceiptPreviewUri(item.uri);
                    setReceiptPreviewVisible(true);
                  }}
                  style={[styles.documentCard, documentItems.length === 1 ? styles.documentCardFull : styles.documentCardHalf]}
                >
                  <Image resizeMode="cover" source={{ uri: item.uri }} style={styles.receiptImage} />
                  <Text style={[styles.documentLabel, { textAlign: isRTL ? "right" : "left" }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.actionsSeparator} />

        <Pressable onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>{t("productDetail.editProduct")}</Text>
        </Pressable>

        <Pressable disabled={isDeleting} onPress={handleDelete} style={styles.deleteButton}>
          {isDeleting ? <ActivityIndicator color={colors.danger} size="small" /> : <Text style={styles.deleteButtonText}>{t("productDetail.deleteProduct")}</Text>}
        </Pressable>

        {errorKey ? <Text style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}>{t(errorKey)}</Text> : null}
      </ScrollView>

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
          {receiptPreviewUri ? (
            <Image resizeMode="contain" source={{ uri: receiptPreviewUri }} style={styles.receiptPreviewFullscreenImage} />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function SectionLabel({ label, isRTL }: { label: string; isRTL: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
  );
}

function DetailRow({
  label,
  value,
  icon,
  isRTL,
  onPress,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isRTL: boolean;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Container = onPress ? Pressable : View;

  return (
    <Container
      {...(onPress
        ? {
            onPress,
          }
        : {})}
      style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
    >
      {icon ? <Ionicons color={colors.textSubtle} name={icon} size={15} style={styles.detailIcon} /> : null}
      <Text style={[styles.detailLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          { textAlign: isRTL ? "left" : "right" },
          onPress && styles.detailValueInteractive,
        ]}
      >
        {value}
      </Text>
    </Container>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingScreen: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    content: {
      padding: 16,
      gap: 8,
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
    screenHeaderSpacer: {
      width: 40,
      height: 40,
    },
    screenHeaderTitle: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontFamily: fontFamilies.bold,
      textAlign: "center",
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
    headerCard: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 14,
    },
    headerTop: {
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    title: {
      color: c.text,
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontFamily: fontFamilies.bold,
    },
    metaRows: {
      gap: 10,
    },
    sectionLabel: {
      color: c.textSubtle,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontFamily: fontFamilies.semibold,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginTop: 6,
    },
    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 14,
    },
    detailRow: {
      alignItems: "center",
      gap: 10,
    },
    detailIcon: {
      width: 20,
      alignSelf: "center",
    },
    detailLabel: {
      flex: 1,
      color: c.textSubtle,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.medium,
    },
    detailValue: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    detailValueInteractive: {
      color: c.primary,
      fontFamily: fontFamilies.semibold,
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
    receiptImage: {
      width: "100%",
      height: 200,
      borderRadius: 12,
    },
    documentsGrid: {
      gap: 12,
      alignItems: "stretch",
      flexWrap: "nowrap",
    },
    documentCard: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      gap: 10,
    },
    documentCardFull: {
      width: "100%",
    },
    documentCardHalf: {
      width: "48%",
    },
    documentLabel: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.medium,
    },
    actionsSeparator: {
      height: 1,
      backgroundColor: c.border,
      marginTop: 18,
      marginBottom: 18,
      opacity: 0.7,
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
    serviceCard: {
      backgroundColor: c.accentSoft,
      borderRadius: 22,
      padding: 18,
      gap: 10,
    },
    serviceRow: {
      alignItems: "center",
      gap: 10,
    },
    servicePhoneRow: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    servicePhoneLabelGroup: {
      flex: 1,
    },
    servicePhoneLabel: {
      flex: 0,
      color: c.text,
    },
    serviceName: {
      color: c.text,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    servicePhonePill: {
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    servicePhonePillText: {
      color: c.primary,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.semibold,
    },
    serviceHours: {
      color: c.textMuted,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    notesRow: {
      gap: 10,
      alignItems: "flex-start",
    },
    notesIcon: {
      marginTop: 2,
    },
    notesText: {
      flex: 1,
      color: c.text,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
    deleteButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: c.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    editButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    editButtonText: {
      color: c.surface,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    deleteButtonText: {
      color: c.danger,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontFamily: fontFamilies.semibold,
    },
    errorText: {
      color: c.danger,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontFamily: fontFamilies.regular,
    },
  });
