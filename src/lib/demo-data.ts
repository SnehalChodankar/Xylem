import { Category } from "./types";

// Default categories used when seeding a new user account.
// IDs are intentionally omitted — Supabase will assign real UUIDs.
export const DEFAULT_CATEGORIES: Omit<Category, "id" | "user_id">[] = [
  { name: "Salary",         icon: "💼", color: "#22c55e", type: "income",  is_system: true },
  { name: "Freelance",      icon: "💻", color: "#06b6d4", type: "income",  is_system: true },
  { name: "Investments",    icon: "📈", color: "#8b5cf6", type: "income",  is_system: true },
  { name: "Other Income",   icon: "💰", color: "#10b981", type: "income",  is_system: true },
  { name: "Food & Dining",  icon: "🍕", color: "#f97316", type: "expense", is_system: true },
  { name: "Groceries",      icon: "🛒", color: "#84cc16", type: "expense", is_system: true },
  { name: "Transport",      icon: "🚗", color: "#3b82f6", type: "expense", is_system: true },
  { name: "Rent",           icon: "🏠", color: "#ef4444", type: "expense", is_system: true },
  { name: "Utilities",      icon: "⚡", color: "#eab308", type: "expense", is_system: true },
  { name: "Shopping",       icon: "🛍️", color: "#ec4899", type: "expense", is_system: true },
  { name: "Healthcare",     icon: "🏥", color: "#14b8a6", type: "expense", is_system: true },
  { name: "Entertainment",  icon: "🎬", color: "#a855f7", type: "expense", is_system: true },
  { name: "Education",      icon: "📚", color: "#6366f1", type: "expense", is_system: true },
  { name: "Subscriptions",  icon: "🔄", color: "#f43f5e", type: "expense", is_system: true },
  { name: "EMI / Loans",    icon: "🏦", color: "#78716c", type: "expense", is_system: true },
  { name: "Personal Care",  icon: "✨", color: "#d946ef", type: "expense", is_system: true },
  { name: "Gifts",          icon: "🎁", color: "#fb923c", type: "both",    is_system: true },
  { name: "Other Expense",  icon: "📦", color: "#94a3b8", type: "expense", is_system: true },
];

// Auto-categorization keywords used for CSV import matching.
// These match against category names (case-insensitive) after seeding, 
// so they are name-based rather than ID-based now.
export const CATEGORY_RULES: { keyword: string; categoryName: string }[] = [
  { keyword: "swiggy",      categoryName: "Food & Dining" },
  { keyword: "zomato",      categoryName: "Food & Dining" },
  { keyword: "restaurant",  categoryName: "Food & Dining" },
  { keyword: "uber",        categoryName: "Transport" },
  { keyword: "ola",         categoryName: "Transport" },
  { keyword: "petrol",      categoryName: "Transport" },
  { keyword: "metro",       categoryName: "Transport" },
  { keyword: "amazon",      categoryName: "Shopping" },
  { keyword: "flipkart",    categoryName: "Shopping" },
  { keyword: "myntra",      categoryName: "Shopping" },
  { keyword: "netflix",     categoryName: "Subscriptions" },
  { keyword: "spotify",     categoryName: "Subscriptions" },
  { keyword: "youtube",     categoryName: "Subscriptions" },
  { keyword: "bigbasket",   categoryName: "Groceries" },
  { keyword: "dmart",       categoryName: "Groceries" },
  { keyword: "electricity", categoryName: "Utilities" },
  { keyword: "recharge",    categoryName: "Utilities" },
  { keyword: "salary",      categoryName: "Salary" },
  { keyword: "rent",        categoryName: "Rent" },
  { keyword: "emi",         categoryName: "EMI / Loans" },
  { keyword: "pharmacy",    categoryName: "Healthcare" },
  { keyword: "doctor",      categoryName: "Healthcare" },
  { keyword: "hospital",    categoryName: "Healthcare" },
  { keyword: "gym",         categoryName: "Personal Care" },
];
