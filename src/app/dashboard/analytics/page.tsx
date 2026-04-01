"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthName, getMonthShort } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

export default function AnalyticsPage() {
  const { selectedMonth, selectedYear, getMonthlyStats, getCategorySpending, transactions, categories } = useAppStore();
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(6);

  // Monthly trend data
  const trendData = useMemo(() => {
    const data = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m <= 0) { m += 12; y -= 1; }
      const stats = getMonthlyStats(m, y);
      data.push({
        month: getMonthShort(m),
        income: Math.round(stats.totalIncome),
        expenses: Math.round(stats.totalExpenses),
        savings: Math.round(stats.netSavings),
      });
    }
    return data;
  }, [selectedMonth, selectedYear, timeRange, getMonthlyStats]);

  // Category spending for current month
  const categoryData = getCategorySpending(selectedMonth, selectedYear);
  const totalExpenses = categoryData.reduce((sum, c) => sum + c.amount, 0);

  // Top expenses
  const topExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "debit" && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, selectedMonth, selectedYear]);

  // Spending by payment method
  const paymentMethodData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "debit" && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      })
      .forEach((t) => {
        const pm = t.payment_method || "Other";
        map.set(pm, (map.get(pm) || 0) + t.amount);
      });
    const colors = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#eab308"];
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value: Math.round(value), color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedMonth, selectedYear]);

  const stats = getMonthlyStats(selectedMonth, selectedYear);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([3, 6, 12] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                timeRange === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {r}M
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg. Monthly Income</p>
            <p className="text-base lg:text-lg font-bold text-emerald-500 mt-1">
              {formatCurrency(trendData.reduce((s, d) => s + d.income, 0) / trendData.length)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg. Monthly Expenses</p>
            <p className="text-base lg:text-lg font-bold text-red-500 mt-1">
              {formatCurrency(trendData.reduce((s, d) => s + d.expenses, 0) / trendData.length)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg. Savings</p>
            <p className="text-base lg:text-lg font-bold text-blue-500 mt-1">
              {formatCurrency(trendData.reduce((s, d) => s + d.savings, 0) / trendData.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Savings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={40} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                          <p className="font-semibold mb-1">{label}</p>
                          <p className="text-blue-500">Savings: {formatCurrency(payload[0]?.value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} fill="url(#savingsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Category bars */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryData.slice(0, 8).map((item) => {
                const percent = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                return (
                  <div key={item.category.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{item.category.icon}</span>
                        <span className="font-medium">{item.category.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(item.amount)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: item.category.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment method pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-[150px] h-[150px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0} paddingAngle={3}>
                      {paymentMethodData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {paymentMethodData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 text-muted-foreground">{item.name}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 5 Expenses This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topExpenses.map((txn, i) => {
              const cat = categories.find((c) => c.id === txn.category_id);
              return (
                <div key={txn.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/30 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-[11px] text-muted-foreground">{cat?.icon} {cat?.name}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 tabular-nums">{formatCurrency(txn.amount)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
