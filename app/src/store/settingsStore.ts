import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Language, UserProfile, UserSettings } from "../types";

interface SettingsState extends UserSettings {
  hasHydrated: boolean;
  setLanguage: (language: Language) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  syncFromProfile: (profile: UserProfile) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "he",
      notificationsEnabled: true,
      hasHydrated: false,
      setLanguage: async (language) => {
        const nextState = {
          language,
          notificationsEnabled: get().notificationsEnabled,
          hasHydrated: get().hasHydrated,
        };
        await AsyncStorage.setItem(
          "smart-warranty-wallet-settings",
          JSON.stringify({ state: nextState, version: 0 }),
        );
        set({ language });
      },
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      syncFromProfile: (profile) => set({ language: profile.language }),
    }),
    {
      name: "smart-warranty-wallet-settings",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
