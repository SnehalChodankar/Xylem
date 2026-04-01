"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function SpendingChart() {
  const { selectedMonth, selectedYear, getCategorySpending } = useAppStore();
  const spending = getCategorySpending(selectedMonth, selectedYear);
  const total = spending.reduce((sum, s) => sum + s.amount, 0);

  const data = spending.slice(0, 7).map((s) => ({
    name: s.category.name,
    value: Math.round(s.amount),
    color: s.category.color,
    icon: s.category.icon,
    percent: total > 0 ? ((s.amount / total) * 100).toFixed(1) : "0",
  }));

  if (data.length === 0) {
    return (
      <Card className="animate-fade-in opacity-0 stagger-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          No expenses this month
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in opacity-0 stagger-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[160px] h-[160px] lg:w-[180px] lg:h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                          <p className="font-semibold">{d.icon} {d.name}</p>
                          <p className="text-muted-foreground">{formatCurrency(d.value)} ({d.percent}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate flex-1 text-muted-foreground">{item.icon} {item.name}</span>
                <span className="font-semibold tabular-nums">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
