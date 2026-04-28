import { en } from "../i18n/en";
import { he, type TranslationKey } from "../i18n/he";
import { useSettingsStore } from "../store/settingsStore";

const dictionaries = {
  he,
  en,
} as const;

export function useI18n() {
  const language = useSettingsStore((state) => state.language);
  const dictionary = dictionaries[language];

  return {
    language,
    isRTL: language === "he",
    t: (key: TranslationKey) => dictionary[key],
  };
}
