import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

import { db } from "./firebase";
import {
  copyInstallationToDocuments,
  copyReceiptToDocuments,
  deleteLocalInstallation,
  deleteLocalReceipt,
} from "./receiptStorage";
import {
  computeWarrantyEnd,
  computeWarrantyStartDate,
  computeWarrantyStatus,
} from "../utils/warranty";
import type { Product, ProductInput } from "../types";

type RawFirestoreProduct = {
  id?: string;
  userId: string;
  name: string;
  brand?: string;
  category?: string;
  serial?: string;
  imei?: string;
  purchaseDate: string;
  warrantyYears?: number;
  warrantyMonths?: number;
  importer?: string;
  importerPhone?: string;
  notes?: string;
  price?: number | null;
  currency?: string;
  requiresInstallation?: boolean;
  installationDate?: string | null;
  installerName?: string | null;
  installationNotes?: string | null;
  installationImageUrl?: string | null;
  receiptImageUrl?: string | null;
  warrantyImageUrl?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function serializeTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
}

export async function addProduct(
  uid: string,
  input: Omit<ProductInput, "receiptImageUrl">,
  receiptLocalUri?: string | null,
  installLocalUri?: string | null,
): Promise<string> {
  const productDocRef = doc(collection(db, "users", uid, "products"));
  let receiptImageUrl: string | null = null;
  let installationImageUrl: string | null = null;

  if (receiptLocalUri) {
    try {
      receiptImageUrl = await copyReceiptToDocuments(receiptLocalUri, productDocRef.id);
    } catch {
      receiptImageUrl = null;
    }
  }

  if (installLocalUri) {
    try {
      installationImageUrl = await copyInstallationToDocuments(installLocalUri, productDocRef.id);
    } catch {
      installationImageUrl = null;
    }
  }

  await setDoc(productDocRef, {
    ...input,
    receiptImageUrl,
    installationImageUrl,
    id: productDocRef.id,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return productDocRef.id;
}

export async function deleteProduct(
  uid: string,
  productId: string,
  receiptUrl?: string | null,
  installUrl?: string | null,
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "products", productId));
  await deleteLocalReceipt(receiptUrl);
  await deleteLocalInstallation(installUrl);
}

export async function updateProduct(
  uid: string,
  productId: string,
  input: Omit<ProductInput, "receiptImageUrl">,
  receiptLocalUri?: string | null,
  existingReceiptUrl?: string | null,
  originalReceiptUrl?: string | null,
  installLocalUri?: string | null,
  existingInstallUrl?: string | null,
  originalInstallUrl?: string | null,
): Promise<void> {
  let receiptImageUrl = existingReceiptUrl ?? null;
  let installationImageUrl = existingInstallUrl ?? null;

  if (receiptLocalUri) {
    try {
      await deleteLocalReceipt(originalReceiptUrl);
      receiptImageUrl = await copyReceiptToDocuments(receiptLocalUri, productId);
    } catch {
      receiptImageUrl = null;
    }
  } else if (existingReceiptUrl === null && originalReceiptUrl) {
    await deleteLocalReceipt(originalReceiptUrl);
    receiptImageUrl = null;
  }

  if (installLocalUri) {
    try {
      await deleteLocalInstallation(originalInstallUrl);
      installationImageUrl = await copyInstallationToDocuments(installLocalUri, productId);
    } catch {
      installationImageUrl = null;
    }
  } else if (existingInstallUrl === null && originalInstallUrl) {
    await deleteLocalInstallation(originalInstallUrl);
    installationImageUrl = null;
  }

  await updateDoc(doc(db, "users", uid, "products", productId), {
    ...input,
    receiptImageUrl,
    installationImageUrl,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToProducts(
  uid: string,
  onData: (products: Product[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const productsQuery = query(collection(db, "users", uid, "products"), orderBy("createdAt", "desc"));

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs.map((snapshotDoc) => {
        const data = snapshotDoc.data() as RawFirestoreProduct;
        const warrantyMonths = data.warrantyMonths ?? ((data.warrantyYears ?? 1) * 12);
        const requiresInstallation = data.requiresInstallation ?? false;
        const installationDate = data.installationDate ?? null;
        const warrantyStartDate = computeWarrantyStartDate(
          data.purchaseDate,
          requiresInstallation,
          installationDate,
        );
        const warrantyEnd = computeWarrantyEnd(warrantyStartDate, warrantyMonths);

        return {
          id: snapshotDoc.id,
          userId: data.userId,
          name: data.name,
          brand: data.brand ?? "",
          category: data.category ?? "",
          serial: data.serial ?? "",
          imei: data.imei ?? "",
          purchaseDate: data.purchaseDate,
          requiresInstallation,
          installationDate,
          installerName: data.installerName ?? "",
          installationNotes: data.installationNotes ?? "",
          installationImageUrl: data.installationImageUrl ?? null,
          warrantyStartDate,
          warrantyYears: data.warrantyYears,
          warrantyMonths,
          importer: data.importer ?? "",
          importerPhone: data.importerPhone ?? "",
          notes: data.notes ?? "",
          price: data.price ?? null,
          currency: data.currency ?? "ILS",
          receiptImageUrl: data.receiptImageUrl ?? null,
          warrantyImageUrl: data.warrantyImageUrl ?? null,
          createdAt: serializeTimestamp(data.createdAt),
          updatedAt: serializeTimestamp(data.updatedAt),
          warrantyEnd,
          status: computeWarrantyStatus(warrantyEnd),
        } satisfies Product;
      });

      onData(products);
    },
    (error) => {
      onError(error);
    },
  );
}
