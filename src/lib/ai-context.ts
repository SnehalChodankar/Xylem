import { useAppStore } from "./store";
import { format } from "date-fns";

/**
 * Extracts a heavily structured and summarized JSON snapshot of the user's
 * current financial state from the Zustand store.
 * We pass this to the LLM context so it has hyper-accurate local database knowledge.
 */
export function generateFinancialContext() {
  const {
    transactions,
    accounts,
    budgets,
    goals,
    getLiveAccountBalance,
    getAccountGoalStats,
  } = useAppStore.getState();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Account Balances & Cash Flow
  const accountStates = accounts.map((acc) => {
    const liveBal = getLiveAccountBalance(acc.id);
    const { allocated, free } = getAccountGoalStats(acc.id);
    return {
      name: acc.name,
      type: acc.type,
      live_balance: liveBal,
      goal_allocated_funds: allocated,
      free_spendable_funds: free,
    };
  });

  // 2. Active Budgets vs Spending
  const activeBudgets = budgets
    .filter((b) => b.month === currentMonth && b.year === currentYear)
    .map((b) => ({
      category: b.category?.name || "Unknown",
      allocated_budget: b.amount,
      currently_spent: b.spent || 0,
    }));

  // 3. Goals Progress
  const activeGoals = goals
    .filter((g) => !g.is_completed)
    .map((g) => ({
      name: g.name,
      target: g.target_amount,
      saved: g.current_amount,
      remaining: g.target_amount - g.current_amount,
      deadline: g.deadline || "None",
    }));

  // 4. Last 100 Transactions (Context window buffer)
  const recentTransactions = transactions.slice(0, 100).map((t) => ({
    date: t.date,
    amount: t.amount,
    type: t.type,
    category: t.category?.name || "Uncategorized",
    description: t.description,
  }));

  return JSON.stringify({
    system_time: format(now, "yyyy-MM-dd HH:mm:ss"),
    accounts: accountStates,
    current_month_budgets: activeBudgets,
    savings_goals: activeGoals,
    recent_transactions: recentTransactions,
  });
}
