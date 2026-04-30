import type { CategoryOption } from "../constants/categories";

let categoryPickerCallback: ((category: CategoryOption) => void) | null = null;

export function setCategoryPickerCallback(callback: ((category: CategoryOption) => void) | null) {
  categoryPickerCallback = callback;
}

export function resolveCategoryPicker(category: CategoryOption) {
  categoryPickerCallback?.(category);
  categoryPickerCallback = null;
}
