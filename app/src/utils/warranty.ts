import type { Language, WarrantyStatus } from "../types";

function parseIsoDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);

  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsClamped(date: Date, monthsToAdd: number) {
  const originalDay = date.getDate();
  const targetMonthIndex = date.getMonth() + monthsToAdd;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(originalDay, getDaysInMonth(targetYear, normalizedMonthIndex));

  return new Date(targetYear, normalizedMonthIndex, targetDay);
}

export function computeWarrantyEnd(purchaseDate: string, warrantyMonths: number): string {
  const date = addMonthsClamped(parseIsoDate(purchaseDate), warrantyMonths);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDaysLeft(warrantyEnd: string): number {
  const endDate = parseIsoDate(warrantyEnd);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = endDate.getTime() - todayStart.getTime();

  return Math.floor(diffMs / 86400000);
}

export function computeWarrantyStatus(warrantyEnd: string): WarrantyStatus {
  const daysLeft = getDaysLeft(warrantyEnd);

  if (daysLeft < 0) {
    return "expired";
  }

  if (daysLeft <= 30) {
    return "expiringSoon";
  }

  return "valid";
}

export function formatDateDisplay(dateStr: string, language: Language): string {
  const date = parseIsoDate(dateStr);

  return date.toLocaleDateString(language === "he" ? "he-IL" : "en-US");
}

export function formatWarrantyDuration(months: number, language: Language): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;

  if (language === "he") {
    if (years === 0) {
      return `${months} חודשים`;
    }

    if (years === 1 && rem === 0) {
      return "שנה";
    }

    if (years === 1) {
      return `שנה ו-${rem} חודשים`;
    }

    if (rem === 0) {
      return `${years} שנים`;
    }

    return `${years} שנים ו-${rem} חודשים`;
  }

  if (years === 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  if (years === 1 && rem === 0) {
    return "1 year";
  }

  if (years === 1) {
    return `1 year and ${rem} month${rem === 1 ? "" : "s"}`;
  }

  if (rem === 0) {
    return `${years} years`;
  }

  return `${years} years and ${rem} month${rem === 1 ? "" : "s"}`;
}

export function formatDaysLeftPrecise(daysLeft: number, language: Language): string {
  const years = Math.floor(daysLeft / 365);
  const remainingAfterYears = daysLeft % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;

  if (language === "he") {
    if (years > 0 && months > 0) {
      return `${years === 1 ? "שנה" : `${years} שנים`} ו-${months} חודשים`;
    }
    if (years > 0) {
      return years === 1 ? "שנה" : `${years} שנים`;
    }
    if (months > 0 && days > 0) {
      return `${months} חודשים ו-${days} ימים`;
    }
    if (months > 0) {
      return `${months} חודשים`;
    }
    return `${daysLeft} ימים`;
  }

  if (years > 0 && months > 0) {
    return `${years === 1 ? "1 year" : `${years} years`} and ${months} month${months === 1 ? "" : "s"}`;
  }
  if (years > 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  if (months > 0 && days > 0) {
    return `${months} month${months === 1 ? "" : "s"} and ${days} day${days === 1 ? "" : "s"}`;
  }
  if (months > 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
}
