"use client";

import { create } from "zustand";
import { Transaction, Category, Account, Budget, RecurringTransaction, Notification, CategoryRule } from "./types";
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
  recurring_transactions: RecurringTransaction[];
  notifications: Notification[];
  categoryRules: CategoryRule[];

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
  
  // ── actions: recurring ──
  addRecurringTransaction: (r: Omit<RecurringTransaction, "id" | "created_at" | "user_id">) => Promise<void>;
  updateRecurringTransaction: (id: string, r: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;

  // ── actions: notifications ──
  addNotification: (n: Omit<Notification, "id" | "created_at" | "user_id" | "is_read">) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

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

  // ── actions: category rules ──
  addCategoryRule: (rule: Omit<CategoryRule, "id" | "user_id" | "created_at">) => void;
  deleteCategoryRule: (id: string) => void;

  // ── computed ──
  getFilteredTransactions: (month: number, year: number) => Transaction[];
  getMonthlyStats: (month: number, year: number) => MonthlyStats;
  getCategorySpending: (month: number, year: number) => CategorySpending[];
  getBudgetProgress: (month: number, year: number) => BudgetWithProgress[];
  getLiveAccountBalance: (accountId: string) => number;

  // ── reconciliation ──
  reconcileAccount: (accountId: string, realBalance: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  isLoading: true,
  transactions: [],
  categories: [],
  accounts: [],
  budgets: [],
  recurring_transactions: [],
  notifications: [],
  categoryRules: [],
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

    const [txRes, catRes, accRes, budRes, recRes, notRes, ruleRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", userId).order("name"),
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      supabase.from("recurring_transactions").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("category_rules").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const transactions = (txRes.data ?? []) as Transaction[];
    let notifications = (notRes.data ?? []) as Notification[];
    const categoryRules = (ruleRes.data ?? []) as CategoryRule[];

    // === TYPE 3: SYSTEM ANALYTICS SUMMARY ===
    // We only perform this algorithmic check once per week to avoid spamming the user.
    const lastSpikeNotif = notifications.find(n => n.title === "Unusual Spend Spike");
    const isRecent = lastSpikeNotif && (new Date(lastSpikeNotif.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (!isRecent && transactions.length > 0) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const currentWeekSpend = transactions
        .filter(t => t.type === "debit" && new Date(t.date) >= oneWeekAgo)
        .reduce((sum, t) => sum + t.amount, 0);

      const previousWeekSpend = transactions
        .filter(t => t.type === "debit" && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
        .reduce((sum, t) => sum + t.amount, 0);

      // If user spent more than ₹1000 and it's practically double the previous week:
      if (currentWeekSpend > 1000 && currentWeekSpend > (previousWeekSpend * 2)) {
        const anomalyNotif = {
          user_id: userId,
          title: "Unusual Spend Spike",
          message: `Your spending this week (₹${currentWeekSpend.toFixed(0)}) is significantly higher than last week (₹${previousWeekSpend.toFixed(0)}).`,
          type: "info",
          action_url: "/dashboard/analytics",
          is_read: false
        };
        
        const { data: newNotif } = await supabase.from("notifications").insert(anomalyNotif).select().single();
        if (newNotif) {
          notifications = [newNotif as Notification, ...notifications];
        }
      }
    }

    set({
      transactions,
      categories: (catRes.data ?? []) as Category[],
      accounts: (accRes.data ?? []) as Account[],
      budgets: (budRes.data ?? []) as Budget[],
      recurring_transactions: (recRes.data ?? []) as RecurringTransaction[],
      notifications,
      categoryRules,
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

  // ── Recurring Transactions ────────────────────────────────
  addRecurringTransaction: async (rec) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("recurring_transactions")
      .insert({ ...rec, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ recurring_transactions: [...s.recurring_transactions, data as RecurringTransaction] }));
    }
  },

  updateRecurringTransaction: async (id, updates) => {
    const { error } = await supabase.from("recurring_transactions").update(updates).eq("id", id);
    if (!error) {
      set((s) => ({
        recurring_transactions: s.recurring_transactions.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    }
  },

  deleteRecurringTransaction: async (id) => {
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    if (!error) {
      set((s) => ({ recurring_transactions: s.recurring_transactions.filter((r) => r.id !== id) }));
    }
  },

  // ── Notifications ─────────────────────────────────────────
  addNotification: async (notif) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .insert({ ...notif, user_id: userId, is_read: false })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ notifications: [data as Notification, ...s.notifications] }));
    }
  },

  markNotificationAsRead: async (id) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (!error) {
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      }));
    }
  },

  markAllNotificationsAsRead: async () => {
    const { userId } = get();
    if (!userId) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    if (!error) {
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      }));
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

  // ── Category Rules ───────────────────────────────────────────
  addCategoryRule: async (rule) => {
    const { userId } = get();
    if (!userId) return;

    const newRule = {
      ...rule,
      user_id: userId,
      id: crypto.randomUUID(),
    };

    // Optimistic Update
    set((s) => ({ categoryRules: [...s.categoryRules, newRule as CategoryRule] }));

    const { error } = await supabase.from("category_rules").insert(newRule);
    if (error) {
      // Revert on fail
      console.error("Rule insert failed", error);
      set((s) => ({ categoryRules: s.categoryRules.filter((r) => r.id !== newRule.id) }));
    }
  },

  deleteCategoryRule: async (id) => {
    // Optimistic Update
    const oldRules = get().categoryRules;
    set((s) => ({ categoryRules: s.categoryRules.filter((r) => r.id !== id) }));

    const { error } = await supabase.from("category_rules").delete().eq("id", id);
    if (error) {
      console.error("Rule delete failed", error);
      set({ categoryRules: oldRules });
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

  // ── Live Account Balance ────────────────────────────────────────────────────
  // Computes: Opening Balance + all credits linked to account - all debits linked to account
  getLiveAccountBalance: (accountId: string) => {
    const { accounts, transactions } = get();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;

    const accountTxns = transactions.filter((t) => t.account_id === accountId);
    const totalCredits = accountTxns
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = accountTxns
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    return account.balance + totalCredits - totalDebits;
  },

  // ── Reconciliation ─────────────────────────────────────────────────────────
  // Creates an adjusting transaction to bridge the gap between Xylem and real bank
  reconcileAccount: async (accountId: string, realBalance: number) => {
    const { userId, getLiveAccountBalance, addTransaction, accounts } = get();
    if (!userId) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const xylemBalance = getLiveAccountBalance(accountId);
    const discrepancy = realBalance - xylemBalance;

    if (Math.abs(discrepancy) < 0.01) return; // Already in sync, nothing to do

    const adjustingTxn = {
      account_id: accountId,
      type: discrepancy > 0 ? ("credit" as const) : ("debit" as const),
      amount: Math.abs(discrepancy),
      description: "Account Reconciliation Adjustment",
      notes: `Reconciliation adjustment on ${new Date().toLocaleDateString("en-IN")}. Xylem balance: ₹${xylemBalance.toFixed(2)}, Actual bank balance: ₹${realBalance.toFixed(2)}.`,
      date: new Date().toISOString().split("T")[0],
      payment_method: "other",
    };

    await addTransaction(adjustingTxn);
  },
}));
