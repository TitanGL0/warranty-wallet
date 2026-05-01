import * as FileSystem from "expo-file-system/legacy";

const RECEIPTS_DIR_NAME = "receipts";
const LOCAL_PREFIX = "local://";
const LOCAL_RECEIPT_PREFIX = `local://${RECEIPTS_DIR_NAME}/`;

function getReceiptsDirectory() {
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${RECEIPTS_DIR_NAME}/` : null;
}

function getReceiptToken(productId: string) {
  return `${LOCAL_RECEIPT_PREFIX}${productId}.jpg`;
}

async function ensureDir(subdir: string): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error("document_directory_unavailable");
  }
  const dir = `${FileSystem.documentDirectory}${subdir}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export function resolveReceiptUri(receiptUrl: string | null | undefined): string | null {
  if (!receiptUrl) {
    return null;
  }

  if (receiptUrl.startsWith(LOCAL_PREFIX)) {
    if (!FileSystem.documentDirectory) {
      return null;
    }

    return `${FileSystem.documentDirectory}${receiptUrl.slice(LOCAL_PREFIX.length)}`;
  }

  return receiptUrl;
}

export async function copyReceiptToDocuments(srcUri: string, productId: string): Promise<string> {
  const receiptsDirectory = getReceiptsDirectory();

  if (!receiptsDirectory) {
    throw new Error("document_directory_unavailable");
  }

  const destinationUri = `${receiptsDirectory}${productId}.jpg`;

  await ensureDir("receipts");
  await FileSystem.copyAsync({
    from: srcUri,
    to: destinationUri,
  });

  return getReceiptToken(productId);
}

export async function copyInstallationToDocuments(
  srcUri: string,
  productId: string,
): Promise<string> {
  await ensureDir("install");
  const relativePath = `install/${productId}.jpg`;
  if (!FileSystem.documentDirectory) {
    throw new Error("document_directory_unavailable");
  }
  const destUri = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.copyAsync({ from: srcUri, to: destUri });
  return `local://${relativePath}`;
}

export async function deleteLocalReceipt(receiptUrl: string | null | undefined): Promise<void> {
  const resolvedUri = resolveReceiptUri(receiptUrl);

  if (!receiptUrl || !resolvedUri || !receiptUrl.startsWith(LOCAL_RECEIPT_PREFIX)) {
    return;
  }

  const info = await FileSystem.getInfoAsync(resolvedUri);

  if (info.exists) {
    await FileSystem.deleteAsync(resolvedUri, { idempotent: true });
  }
}

export async function deleteLocalInstallation(installUrl: string | null | undefined): Promise<void> {
  if (!installUrl?.startsWith("local://")) return;
  const fullUri = resolveReceiptUri(installUrl);
  if (!fullUri) return;
  const info = await FileSystem.getInfoAsync(fullUri);
  if (info.exists) {
    await FileSystem.deleteAsync(fullUri, { idempotent: true });
  }
}
