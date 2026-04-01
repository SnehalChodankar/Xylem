"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthName } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, Percent, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";

export default function DashboardPage() {
  const { selectedMonth, selectedYear, getMonthlyStats, getCategorySpending } = useAppStore();
  const stats = getMonthlyStats(selectedMonth, selectedYear);
  const [addOpen, setAddOpen] = useState(false);

  const statCards = [
    {
      title: "Income",
      value: stats.totalIncome,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Expenses",
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      title: "Net Savings",
      value: stats.netSavings,
      icon: PiggyBank,
      color: stats.netSavings >= 0 ? "text-blue-500" : "text-orange-500",
      bg: stats.netSavings >= 0 ? "bg-blue-500/10" : "bg-orange-500/10",
      border: stats.netSavings >= 0 ? "border-blue-500/20" : "border-orange-500/20",
    },
    {
      title: "Savings Rate",
      value: stats.savingsRate,
      icon: Percent,
      color: stats.savingsRate >= 20 ? "text-purple-500" : "text-amber-500",
      bg: stats.savingsRate >= 20 ? "bg-purple-500/10" : "bg-amber-500/10",
      border: stats.savingsRate >= 20 ? "border-purple-500/20" : "border-amber-500/20",
      isPercent: true,
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getMonthName(selectedMonth)} {selectedYear}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your financial overview</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((card, i) => (
          <Card
            key={card.title}
            className={cn(
              "border animate-fade-in opacity-0 overflow-hidden relative group hover:shadow-lg transition-all duration-300",
              card.border,
              `stagger-${i + 1}`
            )}
          >
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={cn("p-2 rounded-xl", card.bg)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
              <p className={cn("text-xl lg:text-2xl font-bold tracking-tight", card.color)}>
                {card.isPercent
                  ? `${card.value.toFixed(1)}%`
                  : formatCurrency(card.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SpendingChart />
        <IncomeExpenseChart />
      </div>

      {/* Budget + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <BudgetOverview />
        <RecentTransactions />
      </div>
    </div>
  );
}
