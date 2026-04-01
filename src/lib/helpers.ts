export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 100000) {
    return "₹" + (amount / 100000).toFixed(1) + "L";
  }
  if (Math.abs(amount) >= 1000) {
    return "₹" + (amount / 1000).toFixed(1) + "K";
  }
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1).toLocaleString("en-IN", { month: "long" });
}

export function getMonthShort(month: number): string {
  return new Date(2024, month - 1).toLocaleString("en-IN", { month: "short" });
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}
