import type Ionicons from "@expo/vector-icons/Ionicons";

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  refrigerator: "snow-outline",
  tv: "tv-outline",
  washingMachine: "water-outline",
  smartphone: "phone-portrait-outline",
  computer: "laptop-outline",
  headphones: "headset-outline",
  ac: "thermometer-outline",
  dishwasher: "sparkles-outline",
  other: "cube-outline",
};

export function getCategoryIcon(category: string | undefined): keyof typeof Ionicons.glyphMap {
  if (!category) return "cube-outline";
  return CATEGORY_ICONS[category] ?? "cube-outline";
}
