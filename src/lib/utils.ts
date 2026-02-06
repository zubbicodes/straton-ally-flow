import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format amount as Pakistani Rupee (PKR). Use for all currency display in the app. */
export function formatCurrencyPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a 24h time string (HH:mm or HH:mm:ss) as 12-hour AM/PM.
 * Use for all time display across the app.
 * @param time - e.g. "09:00", "17:30:00", "22:00"
 * @returns e.g. "9:00 AM", "5:30 PM", "10:00 PM" or "—" if empty
 */
export function formatTime12h(time: string | null | undefined): string {
  if (time == null || String(time).trim() === "") return "—";
  const parts = String(time).trim().split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(hours)) return "—";
  const d = new Date(2000, 0, 1, hours, minutes, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
