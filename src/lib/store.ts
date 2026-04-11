"use client";

import { create } from "zustand";
import { Transaction, Category, Account, Budget, RecurringTransaction, Notification, CategoryRule, SmsTransaction, SmsSenderMapping, Goal } from "./types";
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
  smsTransactions: SmsTransaction[];
  smsSenderMappings: SmsSenderMapping[];
  goals: Goal[];

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

  // ── actions: SMS staging ──
  approveSmsTransaction: (id: string, edits: Partial<SmsTransaction>) => Promise<void>;
  rejectSmsTransaction: (id: string) => Promise<void>;
  addSmsSenderMapping: (m: Omit<SmsSenderMapping, "id" | "user_id" | "created_at">) => Promise<void>;
  deleteSmsSenderMapping: (id: string) => Promise<void>;

  // ── actions: goals ──
  addGoal: (g: Omit<Goal, "id" | "user_id" | "created_at" | "is_completed" | "current_amount">) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;
  withdrawFromGoal: (goalId: string, amount: number) => Promise<void>;
  redeemGoal: (goalId: string, amount: number, description: string, categoryId?: string) => Promise<void>;
  getAccountGoalStats: (accountId: string) => { allocated: number; free: number };

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
  smsTransactions: [],
  smsSenderMappings: [],
  goals: [],
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

    // Cleanup: delete rejected SMS transactions older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    supabase.from("sms_transactions").delete()
      .eq("user_id", userId).eq("status", "rejected").lt("created_at", thirtyDaysAgo);

    const [txRes, catRes, accRes, budRes, recRes, notRes, ruleRes, smsRes, mappingRes, goalsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", userId).order("name"),
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      supabase.from("recurring_transactions").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("category_rules").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      fetch("/api/sms").then(res => res.json()), // Secure API fetch with server-side AES decryption
      supabase.from("sms_sender_mappings").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    const transactions = (txRes.data ?? []) as Transaction[];
    let notifications = (notRes.data ?? []) as Notification[];
    const categoryRules = (ruleRes.data ?? []) as CategoryRule[];
    const smsTransactions = (smsRes.data ?? []) as SmsTransaction[];
    const smsSenderMappings = (mappingRes.data ?? []) as SmsSenderMapping[];

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
      smsTransactions,
      smsSenderMappings,
      goals: (goalsRes.data ?? []) as Goal[],
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
    const oldRules = get().categoryRules;
    set((s) => ({ categoryRules: s.categoryRules.filter((r) => r.id !== id) }));
    const { error } = await supabase.from("category_rules").delete().eq("id", id);
    if (error) {
      console.error("Rule delete failed", error);
      set({ categoryRules: oldRules });
    }
  },

  // ── SMS Staging ───────────────────────────────────────────
  approveSmsTransaction: async (id, edits) => {
    const { userId, smsTransactions } = get();
    if (!userId) return;
    const staged = smsTransactions.find((s) => s.id === id);
    if (!staged) return;

    const merged = { ...staged, ...edits };

    // Insert into live transactions
    const { data, error } = await supabase.from("transactions").insert({
      user_id: userId,
      description: merged.description,
      amount: merged.amount,
      type: merged.type,
      date: merged.date,
      account_id: merged.account_id ?? null,
      category_id: merged.category_id ?? null,
      notes: merged.raw_message,
    }).select().single();

    if (error) { console.error("Approve SMS failed", error); return; }

    // Mark as approved in staging table
    await supabase.from("sms_transactions").update({ status: "approved" }).eq("id", id);

    // Update local state
    set((s) => ({
      transactions: [data as Transaction, ...s.transactions],
      smsTransactions: s.smsTransactions.map((t) =>
        t.id === id ? { ...t, status: "approved" as const } : t
      ),
    }));
  },

  rejectSmsTransaction: async (id) => {
    await supabase.from("sms_transactions").update({ status: "rejected" }).eq("id", id);
    set((s) => ({
      smsTransactions: s.smsTransactions.map((t) =>
        t.id === id ? { ...t, status: "rejected" as const } : t
      ),
    }));
  },

  addSmsSenderMapping: async (mapping) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("sms_sender_mappings")
      .insert({ ...mapping, user_id: userId })
      .select().single();
    if (!error && data) {
      set((s) => ({ smsSenderMappings: [...s.smsSenderMappings, data as SmsSenderMapping] }));
    }
  },

  deleteSmsSenderMapping: async (id) => {
    await supabase.from("sms_sender_mappings").delete().eq("id", id);
    set((s) => ({ smsSenderMappings: s.smsSenderMappings.filter((m) => m.id !== id) }));
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

  // ── Goals ──────────────────────────────────────────────────────────────────
  addGoal: async (g) => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await supabase
      .from("goals")
      .insert({ ...g, user_id: userId, current_amount: 0, is_completed: false })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ goals: [data as Goal, ...s.goals] }));
    }
  },

  updateGoal: async (id, g) => {
    const { error } = await supabase.from("goals").update(g).eq("id", id);
    if (!error) {
      set((s) => ({ goals: s.goals.map((goal) => (goal.id === id ? { ...goal, ...g } : goal)) }));
    }
  },

  deleteGoal: async (id) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (!error) {
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    }
  },

  contributeToGoal: async (goalId, amount) => {
    const { goals } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
    const justReachedTarget = newAmount >= goal.target_amount && goal.current_amount < goal.target_amount;

    // Do NOT auto-complete — the goal stays active so the user can explicitly redeem
    const { error } = await supabase
      .from("goals")
      .update({ current_amount: newAmount })
      .eq("id", goalId);

    if (!error) {
      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, current_amount: newAmount } : g
        ),
      }));

      if (justReachedTarget) {
        // 🎉 Confetti
        import("canvas-confetti").then((mod) => {
          mod.default({
            particleCount: 160,
            spread: 80,
            origin: { y: 0.6 },
            colors: [goal.color, "#22c55e", "#facc15", "#a78bfa"],
          });
        });

        // 📱 Native push notification
        import("@capacitor/core").then(({ Capacitor }) => {
          if (Capacitor.isNativePlatform()) {
            import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
              LocalNotifications.schedule({
                notifications: [{
                  id: Date.now(),
                  title: "🎉 Target Reached!",
                  body: `You've saved enough for: ${goal.name}! Withdraw your funds when ready.`,
                }],
              });
            });
          }
        });
      }
    }
  },

  withdrawFromGoal: async (goalId: string, amount: number) => {
    const { goals } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Math.max(0, goal.current_amount - amount);
    // If withdrawing from a completed goal, reactivate it
    const shouldReactivate = goal.is_completed && newAmount < goal.target_amount;

    const updates: Partial<Goal> = { current_amount: newAmount };
    if (shouldReactivate) updates.is_completed = false;

    const { error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId);

    if (!error) {
      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        ),
      }));
    }
  },

  redeemGoal: async (goalId: string, amount: number, description: string, categoryId?: string) => {
    const { goals, addTransaction } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const redeemAmount = Math.min(amount, goal.current_amount);
    const isFullRedemption = redeemAmount >= goal.current_amount;
    const newAmount = goal.current_amount - redeemAmount;

    // 1. Create a real debit transaction for the redeemed funds
    const txn: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id"> = {
      type: "debit",
      amount: redeemAmount,
      description: description || `🎯 Goal Redeemed: ${goal.name}`,
      date: new Date().toISOString().split("T")[0],
      account_id: goal.account_id || undefined,
      category_id: categoryId || undefined,
      notes: `Funds withdrawn from savings goal: ${goal.name}`,
      import_source: "manual",
    };
    await addTransaction(txn);

    // 2. Update the goal — mark completed only on full redemption
    const updates: Partial<Goal> = {
      current_amount: newAmount,
      is_completed: isFullRedemption,
    };

    const { error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId);

    if (!error) {
      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        ),
      }));

      if (isFullRedemption) {
        // 🎉 Celebration confetti for full redemption
        import("canvas-confetti").then((mod) => {
          mod.default({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 },
            colors: [goal.color, "#22c55e", "#facc15", "#a78bfa"],
          });
        });
      }
    }
  },

  getAccountGoalStats: (accountId) => {
    const { goals, getLiveAccountBalance } = get();
    const allocated = goals
      .filter((g) => g.account_id === accountId && !g.is_completed)
      .reduce((sum, g) => sum + g.current_amount, 0);
    const liveBalance = getLiveAccountBalance(accountId);
    return { allocated, free: Math.max(0, liveBalance - allocated) };
  },
}));
