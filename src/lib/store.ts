"use client";

import { create } from "zustand";
import { Transaction, Category, Account, Budget } from "./types";
import { DEFAULT_CATEGORIES } from "./demo-data";
import { createClient } from "./supabase/client";

const supabase = createClient();

// ─── helpers ────────────────────────────────────────────────
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

interface CategorySpending {
  category: Category;
  amount: number;
  percentage: number;
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  category?: Category;
}

interface AppState {
  // ── auth ──
  userId: string | null;
  isLoading: boolean;

  // ── data ──
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];

  // ── UI state ──
  selectedMonth: number;
  selectedYear: number;
  isDarkMode: boolean;
  sidebarOpen: boolean;

  // ── actions: data loading ──
  setUser: (userId: string | null) => void;
  fetchData: () => Promise<void>;
  seedDefaultCategories: () => Promise<void>;

  // ── actions: UI ──
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;

  // ── actions: transactions ──
  addTransaction: (t: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importTransactions: (txns: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id">[]) => Promise<void>;

  // ── actions: categories ──
  addCategory: (c: Omit<Category, "id" | "user_id">) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // ── actions: accounts ──
  addAccount: (a: Omit<Account, "id" | "user_id">) => Promise<void>;
  updateAccount: (id: string, a: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // ── actions: budgets ──
  addBudget: (b: Omit<Budget, "id" | "user_id">) => Promise<void>;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // ── computed ──
  getFilteredTransactions: (month: number, year: number) => Transaction[];
  getMonthlyStats: (month: number, year: number) => MonthlyStats;
  getCategorySpending: (month: number, year: number) => CategorySpending[];
  getBudgetProgress: (month: number, year: number) => BudgetWithProgress[];
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  isLoading: true,
  transactions: [],
  categories: [],
  accounts: [],
  budgets: [],
  selectedMonth: currentMonth,
  selectedYear: currentYear,
  isDarkMode: true,
  sidebarOpen: false,

  // ── auth ──────────────────────────────────────────────────
  setUser: (userId) => {
    set({ userId });
  },

  fetchData: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoading: true });

    const [txRes, catRes, accRes, budRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", userId).order("name"),
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
    ]);

    set({
      transactions: (txRes.data ?? []) as Transaction[],
      categories: (catRes.data ?? []) as Category[],
      accounts: (accRes.data ?? []) as Account[],
      budgets: (budRes.data ?? []) as Budget[],
      isLoading: false,
    });
  },

  seedDefaultCategories: async () => {
    const { userId, categories } = get();
    if (!userId || categories.length > 0) return;

    const toInsert = DEFAULT_CATEGORIES.map((c) => ({
      user_id: userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      is_system: true,
    }));

    const { data } = await supabase.from("categories").insert(toInsert).select();
    if (data) set({ categories: data as Category[] });
  },

  // ── UI ────────────────────────────────────────────────────
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Transactions ──────────────────────────────────────────
  addTransaction: async (txn) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...txn, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ transactions: [data as Transaction, ...s.transactions] }));
    }
  },

  updateTransaction: async (id, updates) => {
    const { error } = await supabase.from("transactions").update(updates).eq("id", id);
    if (!error) {
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    }
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    }
  },

  importTransactions: async (txns) => {
    const { userId } = get();
    if (!userId) return;
    const toInsert = txns.map((t) => ({ ...t, user_id: userId }));
    const { data, error } = await supabase.from("transactions").insert(toInsert).select();
    if (!error && data) {
      set((s) => ({ transactions: [...(data as Transaction[]), ...s.transactions] }));
    }
  },

  // ── Categories ────────────────────────────────────────────
  addCategory: async (cat) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...cat, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ categories: [...s.categories, data as Category] }));
    }
  },

  updateCategory: async (id, updates) => {
    const { error } = await supabase.from("categories").update(updates).eq("id", id);
    if (!error) {
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    }
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    }
  },

  // ── Accounts ──────────────────────────────────────────────
  addAccount: async (acc) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("accounts")
      .insert({ ...acc, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ accounts: [...s.accounts, data as Account] }));
    }
  },

  updateAccount: async (id, updates) => {
    const { error } = await supabase.from("accounts").update(updates).eq("id", id);
    if (!error) {
      set((s) => ({
        accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
    }
  },

  deleteAccount: async (id) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (!error) {
      set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
    }
  },

  // ── Budgets ───────────────────────────────────────────────
  addBudget: async (budget) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("budgets")
      .insert({ ...budget, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ budgets: [...s.budgets, data as Budget] }));
    }
  },

  updateBudget: async (id, updates) => {
    const { error } = await supabase.from("budgets").update(updates).eq("id", id);
    if (!error) {
      set((s) => ({
        budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    }
  },

  deleteBudget: async (id) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (!error) {
      set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
    }
  },

  // ── Computed ──────────────────────────────────────────────
  getFilteredTransactions: (month, year) => {
    return get().transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  },

  getMonthlyStats: (month, year) => {
    const txns = get().getFilteredTransactions(month, year);
    const totalIncome = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    return { totalIncome, totalExpenses, netSavings, savingsRate, transactionCount: txns.length };
  },

  getCategorySpending: (month, year) => {
    const txns = get().getFilteredTransactions(month, year).filter((t) => t.type === "debit");
    const { categories } = get();
    const map = new Map<string, number>();
    txns.forEach((t) => {
      if (t.category_id) map.set(t.category_id, (map.get(t.category_id) || 0) + t.amount);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([catId, amount]) => ({
        category: categories.find((c) => c.id === catId) || {
          id: catId, name: "Uncategorized", icon: "📦", color: "#94a3b8", type: "expense" as const, user_id: "", is_system: false,
        },
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  getBudgetProgress: (month, year) => {
    const { budgets, categories, getFilteredTransactions } = get();
    const txns = getFilteredTransactions(month, year);
    return budgets
      .filter((b) => b.month === month && b.year === year)
      .map((b) => {
        const spent = txns
          .filter((t) => t.type === "debit" && t.category_id === b.category_id)
          .reduce((s, t) => s + t.amount, 0);
        return {
          ...b,
          spent,
          category: categories.find((c) => c.id === b.category_id),
        };
      });
  },
}));
