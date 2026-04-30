export const CATEGORY_OPTIONS = [
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

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];
export type CategoryLabelKey =
  | "category.refrigerator"
  | "category.tv"
  | "category.washingMachine"
  | "category.smartphone"
  | "category.computer"
  | "category.headphones"
  | "category.ac"
  | "category.dishwasher"
  | "category.other";

export const CATEGORY_LABEL_KEYS: Record<CategoryOption, CategoryLabelKey> = {
  refrigerator: "category.refrigerator",
  tv: "category.tv",
  washingMachine: "category.washingMachine",
  smartphone: "category.smartphone",
  computer: "category.computer",
  headphones: "category.headphones",
  ac: "category.ac",
  dishwasher: "category.dishwasher",
  other: "category.other",
};
