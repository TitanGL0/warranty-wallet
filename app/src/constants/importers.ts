export interface ImporterDirectoryEntry {
  key: string;
  name: string;
  phone: string;
  hours: string;
  website: string;
}

export const IMPORTERS: Record<string, ImporterDirectoryEntry> = {
  samsung: { key: "samsung", name: "Samsung ישראל", phone: "*6007", hours: "א׳-ה׳ 08:00-17:00", website: "samsung.com/il" },
  lg: { key: "lg", name: "LG ישראל", phone: "03-7777770", hours: "א׳-ה׳ 08:30-17:00", website: "lg.com/il" },
  apple: { key: "apple", name: "iDigital / iCare", phone: "*6000", hours: "א׳-ש׳ 09:00-21:00", website: "idigital.co.il" },
  sony: { key: "sony", name: "Sony ישראל", phone: "03-7684000", hours: "א׳-ה׳ 09:00-17:00", website: "sony.co.il" },
  bosch: { key: "bosch", name: "BSH ישראל", phone: "*3234", hours: "א׳-ה׳ 08:00-16:30", website: "bosch-home.com/il" },
  siemens: { key: "siemens", name: "BSH ישראל", phone: "*3234", hours: "א׳-ה׳ 08:00-16:30", website: "siemens-home.bsh-group.com/il" },
  philips: { key: "philips", name: "פיליפס ישראל", phone: "1-700-500-130", hours: "א׳-ה׳ 09:00-17:00", website: "philips.co.il" },
  hp: { key: "hp", name: "HP ישראל", phone: "*2580", hours: "א׳-ה׳ 08:00-17:00", website: "hp.com/il" },
  lenovo: { key: "lenovo", name: "Lenovo ישראל", phone: "1-800-800-580", hours: "א׳-ה׳ 09:00-17:00", website: "lenovo.com/il" },
  xiaomi: { key: "xiaomi", name: "Xiaomi ישראל", phone: "03-9090909", hours: "א׳-ה׳ 09:00-18:00", website: "xiaomi.co.il" },
  ksp: { key: "ksp", name: "KSP שירות", phone: "*5577", hours: "א׳-ה׳ 09:00-19:00", website: "ksp.co.il" },
  idigital: { key: "idigital", name: "iDigital", phone: "*6000", hours: "א׳-ש׳ 09:00-21:00", website: "idigital.co.il" },
  ivory: { key: "ivory", name: "Ivory", phone: "03-6382727", hours: "א׳-ה׳ 09:00-18:00", website: "ivory.co.il" },
  bug: { key: "bug", name: "BUG", phone: "*2284", hours: "א׳-ה׳ 09:00-18:00", website: "bug.co.il" },
  whirlpool: { key: "whirlpool", name: "וירלפול ישראל", phone: "1-700-505-555", hours: "א׳-ה׳ 08:00-17:00", website: "whirlpool.co.il" },
};

export const importerDirectory = Object.values(IMPORTERS);
