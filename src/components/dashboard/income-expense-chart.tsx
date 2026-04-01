"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthShort } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function IncomeExpenseChart() {
  const { selectedMonth, selectedYear, getMonthlyStats } = useAppStore();

  const data = [];
  for (let i = 5; i >= 0; i--) {
    let m = selectedMonth - i;
    let y = selectedYear;
    if (m <= 0) { m += 12; y -= 1; }
    const stats = getMonthlyStats(m, y);
    data.push({
      month: getMonthShort(m),
      income: Math.round(stats.totalIncome),
      expenses: Math.round(stats.totalExpenses),
    });
  }

  return (
    <Card className="animate-fade-in opacity-0 stagger-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] lg:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
                        <p className="font-semibold">{label}</p>
                        <p className="text-emerald-500">Income: {formatCurrency(payload[0]?.value as number)}</p>
                        <p className="text-red-500">Expenses: {formatCurrency(payload[1]?.value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Income
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Expenses
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
