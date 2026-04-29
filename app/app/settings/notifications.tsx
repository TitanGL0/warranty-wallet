import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Children, type ReactNode, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { type ColorPalette } from "../../src/constants/colors";
import { useI18n } from "../../src/hooks/useI18n";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useSettingsStore } from "../../src/store/settingsStore";
import type { ExpiryAlertDays } from "../../src/types";

const TIMING_OPTIONS: Array<{
  days: ExpiryAlertDays;
  label:
    | "settings.notifications.timing.1month"
    | "settings.notifications.timing.2months"
    | "settings.notifications.timing.3months"
    | "settings.notifications.timing.6months";
}> = [
  { days: 30, label: "settings.notifications.timing.1month" },
  { days: 60, label: "settings.notifications.timing.2months" },
  { days: 90, label: "settings.notifications.timing.3months" },
  { days: 180, label: "settings.notifications.timing.6months" },
];

export default function NotificationSettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, isRTL } = useI18n();
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const notifyExpiringSoon = useSettingsStore((state) => state.notifyExpiringSoon);
  const notifyExpiredWarranty = useSettingsStore((state) => state.notifyExpiredWarranty);
  const notifyMissingReceipt = useSettingsStore((state) => state.notifyMissingReceipt);
  const notifyProductAdded = useSettingsStore((state) => state.notifyProductAdded);
  const notifyMonthlySummary = useSettingsStore((state) => state.notifyMonthlySummary);
  const expiryAlertDays = useSettingsStore((state) => state.expiryAlertDays);
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setNotifyExpiringSoon = useSettingsStore((state) => state.setNotifyExpiringSoon);
  const setNotifyExpiredWarranty = useSettingsStore((state) => state.setNotifyExpiredWarranty);
  const setNotifyMissingReceipt = useSettingsStore((state) => state.setNotifyMissingReceipt);
  const setNotifyProductAdded = useSettingsStore((state) => state.setNotifyProductAdded);
  const setNotifyMonthlySummary = useSettingsStore((state) => state.setNotifyMonthlySummary);
  const setExpiryAlertDays = useSettingsStore((state) => state.setExpiryAlertDays);

  const notificationsDisabled = !notificationsEnabled;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.notifications.title") }} />
      <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Ionicons color={colors.primary} name="notifications-outline" size={20} />
          <Text style={[styles.bannerText, { textAlign: isRTL ? "right" : "left" }]}>{t("settings.notifications.pushNotice")}</Text>
        </View>

        <SettingsCard>
          <ToggleRow
            enabled
            isRTL={isRTL}
            onValueChange={setNotificationsEnabled}
            subtitle={t("settings.notifications.masterDesc")}
            title={t("settings.notifications.masterToggle")}
            value={notificationsEnabled}
          />
        </SettingsCard>

        <SettingsCard>
          <ToggleRow
            enabled={!notificationsDisabled}
            isRTL={isRTL}
            onValueChange={setNotifyExpiringSoon}
            subtitle={t("settings.notifications.expiringSoonDesc")}
            title={t("settings.notifications.expiringSoon")}
            value={notifyExpiringSoon}
          />
          <ToggleRow
            enabled={!notificationsDisabled}
            isRTL={isRTL}
            onValueChange={setNotifyExpiredWarranty}
            subtitle={t("settings.notifications.expiredWarrantyDesc")}
            title={t("settings.notifications.expiredWarranty")}
            value={notifyExpiredWarranty}
          />
          <ToggleRow
            enabled={!notificationsDisabled}
            isRTL={isRTL}
            onValueChange={setNotifyMissingReceipt}
            subtitle={t("settings.notifications.missingReceiptDesc")}
            title={t("settings.notifications.missingReceipt")}
            value={notifyMissingReceipt}
          />
          <ToggleRow
            enabled={!notificationsDisabled}
            isRTL={isRTL}
            onValueChange={setNotifyProductAdded}
            subtitle={t("settings.notifications.productAddedDesc")}
            title={t("settings.notifications.productAdded")}
            value={notifyProductAdded}
          />
          <ToggleRow
            enabled={!notificationsDisabled}
            isRTL={isRTL}
            onValueChange={setNotifyMonthlySummary}
            subtitle={t("settings.notifications.monthlySummaryDesc")}
            title={t("settings.notifications.monthlySummary")}
            value={notifyMonthlySummary}
          />
        </SettingsCard>

        {notificationsEnabled && notifyExpiringSoon ? (
          <SettingsCard>
            <View style={styles.sectionIntro}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                {t("settings.notifications.alertTiming")}
              </Text>
            </View>
            {TIMING_OPTIONS.map((option) => {
              const selected = option.days === expiryAlertDays;
              return (
                <SelectableRow
                  key={option.days}
                  isRTL={isRTL}
                  label={t(option.label)}
                  onPress={() => {
                    setExpiryAlertDays(option.days);
                  }}
                  selected={selected}
                />
              );
            })}
          </SettingsCard>
        ) : null}
      </ScrollView>
    </>
  );
}

function SettingsCard({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const items = Children.toArray(children);

  return (
    <View style={styles.settingsCard}>
      {items.map((child, index) => (
        <View key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  isRTL,
  enabled,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isRTL: boolean;
  enabled: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View
      style={[
        styles.toggleRow,
        { flexDirection: isRTL ? "row-reverse" : "row" },
        !enabled && styles.disabledRow,
      ]}
    >
      <View style={styles.toggleText}>
        <Text style={[styles.rowTitle, { textAlign: isRTL ? "right" : "left" }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { textAlign: isRTL ? "right" : "left" }]}>{subtitle}</Text>
      </View>
      <Switch
        disabled={!enabled}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

function SelectableRow({
  label,
  selected,
  onPress,
  isRTL,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isRTL: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.selectableRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      <View style={styles.selectableTextWrap}>
        <Text style={[styles.rowTitle, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      </View>
      <View style={styles.checkWrap}>
        {selected ? <Ionicons color={colors.primary} name="checkmark" size={16} /> : null}
      </View>
    </Pressable>
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
      gap: 16,
      paddingBottom: 32,
    },
    banner: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 12,
      alignItems: "flex-start",
    },
    bannerText: {
      flex: 1,
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    settingsCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 16,
    },
    toggleRow: {
      minHeight: 76,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: "center",
      gap: 12,
    },
    disabledRow: {
      opacity: 0.4,
    },
    toggleText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "700",
    },
    rowSubtitle: {
      color: c.textSubtle,
      fontSize: 12,
      lineHeight: 18,
    },
    sectionIntro: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "700",
    },
    selectableRow: {
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: "center",
      gap: 12,
    },
    selectableTextWrap: {
      flex: 1,
    },
    checkWrap: {
      width: 18,
      alignItems: "center",
      justifyContent: "center",
    },
  });
