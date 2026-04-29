import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ExpiryAlertDays, Language, Theme, UserProfile, UserSettings } from "../types";

interface SettingsState extends UserSettings {
  hasHydrated: boolean;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (theme: Theme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotifyExpiringSoon: (enabled: boolean) => void;
  setNotifyExpiredWarranty: (enabled: boolean) => void;
  setNotifyMissingReceipt: (enabled: boolean) => void;
  setNotifyProductAdded: (enabled: boolean) => void;
  setNotifyMonthlySummary: (enabled: boolean) => void;
  setExpiryAlertDays: (days: ExpiryAlertDays) => void;
  setHasHydrated: (hydrated: boolean) => void;
  syncFromProfile: (profile: UserProfile) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "he",
      theme: "light",
      notificationsEnabled: true,
      notifyExpiringSoon: true,
      notifyExpiredWarranty: true,
      notifyMissingReceipt: false,
      notifyProductAdded: false,
      notifyMonthlySummary: false,
      expiryAlertDays: 30,
      hasHydrated: false,
      setLanguage: async (language) => {
        const nextState = {
          language,
          theme: get().theme,
          notificationsEnabled: get().notificationsEnabled,
          notifyExpiringSoon: get().notifyExpiringSoon,
          notifyExpiredWarranty: get().notifyExpiredWarranty,
          notifyMissingReceipt: get().notifyMissingReceipt,
          notifyProductAdded: get().notifyProductAdded,
          notifyMonthlySummary: get().notifyMonthlySummary,
          expiryAlertDays: get().expiryAlertDays,
        };
        await AsyncStorage.setItem(
          "smart-warranty-wallet-settings",
          JSON.stringify({ state: nextState, version: 0 }),
        );
        set({ language });
      },
      setTheme: (theme) => set({ theme }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotifyExpiringSoon: (notifyExpiringSoon) => set({ notifyExpiringSoon }),
      setNotifyExpiredWarranty: (notifyExpiredWarranty) => set({ notifyExpiredWarranty }),
      setNotifyMissingReceipt: (notifyMissingReceipt) => set({ notifyMissingReceipt }),
      setNotifyProductAdded: (notifyProductAdded) => set({ notifyProductAdded }),
      setNotifyMonthlySummary: (notifyMonthlySummary) => set({ notifyMonthlySummary }),
      setExpiryAlertDays: (expiryAlertDays) => set({ expiryAlertDays }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated: hasHydrated === true }),
      syncFromProfile: (profile) => set({ language: profile.language }),
    }),
    {
      name: "smart-warranty-wallet-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        notifyExpiringSoon: state.notifyExpiringSoon,
        notifyExpiredWarranty: state.notifyExpiredWarranty,
        notifyMissingReceipt: state.notifyMissingReceipt,
        notifyProductAdded: state.notifyProductAdded,
        notifyMonthlySummary: state.notifyMonthlySummary,
        expiryAlertDays: state.expiryAlertDays,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
