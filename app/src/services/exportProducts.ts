import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { Product } from "../types";

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  "name",
  "brand",
  "category",
  "serial",
  "imei",
  "purchaseDate",
  "warrantyEnd",
  "warrantyMonths",
  "status",
  "price",
  "currency",
  "importer",
  "importerPhone",
  "notes",
  "hasReceipt",
  "requiresInstallation",
  "installationDate",
  "installerName",
  "hasInstallationCertificate",
];

export async function exportProductsToCSV(products: Product[], shareTitle: string): Promise<void> {
  const rows = products.map((p) =>
    [
      p.name,
      p.brand,
      p.category,
      p.serial,
      p.imei,
      p.purchaseDate,
      p.warrantyEnd,
      p.warrantyMonths,
      p.status,
      p.price,
      p.currency,
      p.importer,
      p.importerPhone,
      p.notes,
      p.receiptImageUrl ? "yes" : "no",
      p.requiresInstallation ? "yes" : "no",
      p.installationDate ?? "",
      p.installerName ?? "",
      p.installationImageUrl ? "yes" : "no",
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");
  const fileUri = `${FileSystem.cacheDirectory}warranty-export.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("sharing_unavailable");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: shareTitle,
    UTI: "public.comma-separated-values-text",
  });
}
