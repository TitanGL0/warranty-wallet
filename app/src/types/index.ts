export type Language = "he" | "en";
export type WarrantyStatus = "valid" | "expiringSoon" | "expired";

export interface Product {
  id: string;
  userId: string;
  name: string;
  brand: string;
  category: string;
  serial: string;
  imei?: string;
  purchaseDate: string;
  warrantyYears: number;
  importer: string;
  notes: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  createdAt: string;
  updatedAt: string;
  receiptImageUrl?: string;
  productImageUrl?: string;
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
  notificationsEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  language: Language;
  notificationsEnabled: boolean;
  createdAt: string | null;
}
