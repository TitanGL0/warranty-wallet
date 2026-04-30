import * as FileSystem from "expo-file-system/legacy";

const RECEIPTS_DIR_NAME = "receipts";
const LOCAL_RECEIPT_PREFIX = `local://${RECEIPTS_DIR_NAME}/`;

function getReceiptsDirectory() {
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${RECEIPTS_DIR_NAME}/` : null;
}

function getReceiptToken(productId: string) {
  return `${LOCAL_RECEIPT_PREFIX}${productId}.jpg`;
}

export function resolveReceiptUri(receiptUrl: string | null | undefined): string | null {
  if (!receiptUrl) {
    return null;
  }

  if (receiptUrl.startsWith(LOCAL_RECEIPT_PREFIX)) {
    const receiptsDirectory = getReceiptsDirectory();

    if (!receiptsDirectory) {
      return null;
    }

    return `${receiptsDirectory}${receiptUrl.slice(LOCAL_RECEIPT_PREFIX.length)}`;
  }

  return receiptUrl;
}

export async function copyReceiptToDocuments(srcUri: string, productId: string): Promise<string> {
  const receiptsDirectory = getReceiptsDirectory();

  if (!receiptsDirectory) {
    throw new Error("document_directory_unavailable");
  }

  const destinationUri = `${receiptsDirectory}${productId}.jpg`;

  await FileSystem.makeDirectoryAsync(receiptsDirectory, { intermediates: true });
  await FileSystem.copyAsync({
    from: srcUri,
    to: destinationUri,
  });

  return getReceiptToken(productId);
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
