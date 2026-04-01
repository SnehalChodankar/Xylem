"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDateShort, getRelativeDate } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function RecentTransactions() {
  const { selectedMonth, selectedYear, getFilteredTransactions, categories } = useAppStore();
  const transactions = getFilteredTransactions(selectedMonth, selectedYear).slice(0, 8);

  return (
    <Card className="animate-fade-in opacity-0 stagger-5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        <Link
          href="/dashboard/transactions"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-2 lg:px-4">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No transactions this month
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((txn) => {
              const cat = categories.find((c) => c.id === txn.category_id);
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-base flex-shrink-0">
                    {cat?.icon || (txn.type === "credit" ? "💰" : "💸")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cat?.name || "Uncategorized"} · {getRelativeDate(txn.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums whitespace-nowrap",
                      txn.type === "credit" ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {txn.type === "credit" ? "+" : "−"}{formatCurrency(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
