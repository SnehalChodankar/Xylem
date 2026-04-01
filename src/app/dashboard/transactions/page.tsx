"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate, getRelativeDate } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Filter, Trash2, Plus, Edit3, ChevronDown } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";

export default function TransactionsPage() {
  const { selectedMonth, selectedYear, getFilteredTransactions, categories, accounts, deleteTransaction } = useAppStore();
  const allTransactions = getFilteredTransactions(selectedMonth, selectedYear);
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "debit" | "credit">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          categories.find((c) => c.id === t.category_id)?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allTransactions, typeFilter, categoryFilter, search, categories]);

  const totalIncome = filteredTransactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filteredTransactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteTransaction(id));
    setSelectedIds(new Set());
  };

  // Group by date
  const grouped = useMemo(() => {
    const groups: { [date: string]: typeof filteredTransactions } = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredTransactions]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredTransactions.length} transactions
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Income</p>
            <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Expenses</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["all", "debit", "credit"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as typeof typeFilter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all",
                typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "All" : t === "debit" ? "💸 Expenses" : "💰 Income"}
            </button>
          ))}
          <div className="h-6 w-px bg-border mx-1 self-center" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-transparent text-muted-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl animate-fade-in">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5 ml-auto">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          grouped.map(([date, txns]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground">{getRelativeDate(date)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
              </div>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {txns.map((txn) => {
                    const cat = categories.find((c) => c.id === txn.category_id);
                    const acc = accounts.find((a) => a.id === txn.account_id);
                    const isSelected = selectedIds.has(txn.id);
                    return (
                      <div
                        key={txn.id}
                        onClick={() => toggleSelect(txn.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-accent/30"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl text-base flex-shrink-0 transition-colors",
                          isSelected ? "bg-primary/20" : "bg-muted"
                        )}>
                          {cat?.icon || (txn.type === "credit" ? "💰" : "💸")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{txn.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {cat && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {cat.name}
                              </Badge>
                            )}
                            {txn.payment_method && (
                              <span className="text-[10px] text-muted-foreground">{txn.payment_method}</span>
                            )}
                            {acc && (
                              <span className="text-[10px] text-muted-foreground">· {acc.name}</span>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-bold tabular-nums whitespace-nowrap",
                          txn.type === "credit" ? "text-emerald-500" : "text-red-500"
                        )}>
                          {txn.type === "credit" ? "+" : "−"}{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
