"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Repeat, CalendarClock, Power, CreditCard, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const { recurring_transactions, categories, updateRecurringTransaction, deleteRecurringTransaction } = useAppStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    await updateRecurringTransaction(id, { is_active: !currentStatus });
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    await deleteRecurringTransaction(id);
    setProcessingId(null);
  };

  const getCategory = (catId?: string) => {
    return categories.find((c) => c.id === catId);
  };

  const activeCount = recurring_transactions.filter((r) => r.is_active).length;
  const monthlyTotal = recurring_transactions
    .filter((r) => r.is_active && r.type === "debit")
    .reduce((sum, r) => {
      // rough normalization to monthly cost
      const multiplier =
        r.frequency === "daily" ? 30 :
        r.frequency === "weekly" ? 4.33 :
        r.frequency === "yearly" ? (1 / 12) : 1;
      return sum + (r.amount * multiplier);
    }, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Subscriptions & Bills</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your automated recurring transaction engines
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-md bg-card/60 backdrop-blur-sm">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider flex items-center justify-between">
              Active Engines
              <Repeat className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-border/50 shadow-md bg-card/60 backdrop-blur-sm">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider flex items-center justify-between">
              Est. Monthly Cost
              <CreditCard className="h-4 w-4 text-red-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-red-500">₹{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Roster */}
      <div className="space-y-4">
        {recurring_transactions.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-xl bg-muted/20">
            <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold">No recurring transactions yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
              Create one by checking the "Make this Recurring" box when adding a new transaction in your dashboard!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recurring_transactions.map((rec) => {
              const cat = getCategory(rec.category_id);
              const isProcessing = processingId === rec.id;

              return (
                <div 
                  key={rec.id} 
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all shadow-sm",
                    rec.is_active 
                      ? "bg-card border-border hover:shadow-md" 
                      : "bg-muted/30 border-dashed opacity-75"
                  )}
                >
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className={cn(
                      "flex items-center justify-center h-12 w-12 rounded-xl text-xl shrink-0 shadow-inner",
                      rec.type === "debit" ? "bg-red-500/10" : "bg-emerald-500/10"
                    )}>
                      {cat?.icon || "💵"}
                    </div>
                    
                    <div>
                      <h3 className={cn("font-bold text-lg leading-tight", !rec.is_active && "line-through text-muted-foreground")}>
                        {rec.description}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <span className={cn("w-2 h-2 rounded-full", rec.is_active ? "bg-emerald-500" : "bg-muted-foreground")} />
                          {rec.is_active ? "Active" : "Paused"}
                        </span>
                        <span className="capitalize px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border">
                          {rec.frequency}
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          <CalendarClock className="w-3 h-3" />
                          Next: {format(new Date(rec.next_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:pl-4 sm:border-l border-border/50">
                    <div className={cn(
                      "font-extrabold tracking-tight text-xl",
                      rec.type === "debit" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
                    )}>
                      {rec.type === "debit" ? "-" : "+"}₹{rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={rec.is_active ? "outline" : "default"}
                        className={cn("h-8 px-3 rounded-lg text-xs font-bold", !rec.is_active && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                        disabled={isProcessing}
                        onClick={() => toggleStatus(rec.id, rec.is_active ?? false)}
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5 mr-1" />}
                        {rec.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        disabled={isProcessing}
                        onClick={() => handleDelete(rec.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
