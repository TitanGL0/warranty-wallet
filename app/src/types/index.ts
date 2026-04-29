export type Language = "he" | "en";
export type WarrantyStatus = "valid" | "expiringSoon" | "expired";
export type Theme = "light" | "dark" | "system";
export type ExpiryAlertDays = 30 | 60 | 90 | 180;

export type ProductInput = {
  name: string;
  brand: string;
  category: string;
  serial: string;
  imei: string;
  purchaseDate: string;
  warrantyMonths: number;
  importer: string;
  importerPhone: string;
  notes: string;
  price: number | null;
  currency: string;
  receiptImageUrl: string | null;
  warrantyImageUrl: null;
};

export interface Product {
  id: string;
  userId: string;
  name: string;
  brand: string;
  category: string;
  serial: string;
  imei: string;
  purchaseDate: string;
  warrantyYears?: number;
  warrantyMonths: number;
  importer: string;
  importerPhone: string;
  notes: string;
  price: number | null;
  currency: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  createdAt: string | null;
  updatedAt: string | null;
  receiptImageUrl: string | null;
  warrantyImageUrl: string | null;
}

export interface WarrantyRequest {
  id: string;
  productId: string;
  userId: string;
  issueDescription: string;
  status: "draft" | "submitted" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
  notifyExpiringSoon: boolean;
  notifyExpiredWarranty: boolean;
  notifyMissingReceipt: boolean;
  notifyProductAdded: boolean;
  notifyMonthlySummary: boolean;
  expiryAlertDays: ExpiryAlertDays;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  language: Language;
  notificationsEnabled: boolean;
  createdAt: string | null;
}
