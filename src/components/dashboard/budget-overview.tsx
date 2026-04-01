"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BudgetOverview() {
  const { selectedMonth, selectedYear, getBudgetProgress } = useAppStore();
  const budgets = getBudgetProgress(selectedMonth, selectedYear);

  return (
    <Card className="animate-fade-in opacity-0 stagger-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Budget Progress</CardTitle>
        <Link
          href="/dashboard/budgets"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm gap-2">
            <p>No budgets set</p>
            <Link href="/dashboard/budgets" className="text-xs text-primary hover:underline">
              Set up budgets →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percent = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
              const isOver = budget.spent > budget.amount;
              const isWarning = percent >= 80 && !isOver;

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span>{budget.category?.icon}</span>
                      <span>{budget.category?.name}</span>
                    </span>
                    <span className={cn(
                      "text-xs tabular-nums font-medium",
                      isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 ease-out",
                          isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
