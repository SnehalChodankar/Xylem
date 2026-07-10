"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Goal, Transaction } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Search, Link2, Unlink, ChevronDown, AlertTriangle,
  CheckCircle2, ArrowDownRight,
} from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface LinkSpendingDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function LinkSpendingDialog({ goal, onClose }: LinkSpendingDialogProps) {
  const {
    transactions,
    categories,
    accounts,
    linkTransactionsToGoal,
    unlinkTransactionFromGoal,
    getGoalLinkedTransactions,
    getGoalUsedAmount,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const goalId = goal?.id;
  const linkedTransactions = goalId ? getGoalLinkedTransactions(goalId) : [];
  const usedAmount = goalId ? getGoalUsedAmount(goalId) : 0;
  const funded = goal?.current_amount ?? 0;
  const available = Math.max(0, funded - usedAmount);

  // Available (unlinked) debit transactions
  const cutoffDate = showOlder
    ? "2000-01-01"
    : format(subMonths(new Date(), 2), "yyyy-MM-dd");

  const availableTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.goal_id) return false; // already linked to some goal
        if (t.type !== "debit") return false;
        if (t.exclude_from_ledger) return false;
        if (t.date < cutoffDate) return false;
        if (search) {
          const q = search.toLowerCase();
          const cat = categories.find((c) => c.id === t.category_id);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = cat?.name?.toLowerCase().includes(q);
          const matchAmt = fmt(t.amount).includes(q);
          if (!matchDesc && !matchCat && !matchAmt) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, cutoffDate, search, categories]);

  const selectedTotal = useMemo(() => {
    return transactions
      .filter((t) => selected.has(t.id))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selected, transactions]);

  if (!goal) return null;

  const wouldExceedTarget = (usedAmount + selectedTotal) >= goal.target_amount;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLink = async () => {
    if (selected.size === 0) return;

    // If linking would exceed/meet target, show warning first
    if (wouldExceedTarget && !showWarning) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    const result = await linkTransactionsToGoal(goal.id, Array.from(selected));
    setLoading(false);
    setSelected(new Set());
    setShowWarning(false);

    if (result.completed) {
      onClose();
    }
  };

  const handleUnlink = async (txnId: string) => {
    setUnlinking(txnId);
    await unlinkTransactionFromGoal(txnId);
    setUnlinking(null);
  };

  const getCategoryInfo = (t: Transaction) => {
    const cat = categories.find((c) => c.id === t.category_id);
    return cat ? `${cat.icon} ${cat.name}` : "";
  };

  const getAccountName = (t: Transaction) => {
    const acc = accounts.find((a) => a.id === t.account_id);
    return acc?.name || "";
  };

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="text-2xl">{goal.icon}</span>
            Link Spending — {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* ── Financial Summary ─────────────────────────────────────── */}
          <div
            className="grid grid-cols-3 gap-2 p-3 rounded-xl text-center"
            style={{ backgroundColor: goal.color + "12" }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Funded</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: goal.color }}>{fmt(funded)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Spent</p>
              <p className="text-sm font-bold tabular-nums text-amber-500">{fmt(usedAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Available</p>
              <p className="text-sm font-bold tabular-nums text-emerald-500">{fmt(available)}</p>
            </div>
          </div>

          {/* ── Already Linked Transactions ───────────────────────────── */}
          {linkedTransactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Link2 className="h-3 w-3" />
                Linked Transactions ({linkedTransactions.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto rounded-lg">
                {linkedTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(t.date), "dd MMM yyyy")} · {getCategoryInfo(t)}
                      </p>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-emerald-600 flex-shrink-0">
                      {fmt(t.amount)}
                    </span>
                    <button
                      onClick={() => handleUnlink(t.id)}
                      disabled={unlinking === t.id}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      title="Unlink from goal"
                    >
                      {unlinking === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Unlink className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Search ────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* ── Available Transactions List ────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Transactions to Link
              {selected.size > 0 && (
                <span className="ml-2 text-primary font-bold">
                  · {selected.size} selected · {fmt(selectedTotal)}
                </span>
              )}
            </p>

            {availableTransactions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <ArrowDownRight className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No unlinked debit transactions found
                {!showOlder && (
                  <button
                    onClick={() => setShowOlder(true)}
                    className="block mx-auto mt-2 text-xs text-primary hover:underline"
                  >
                    Show older transactions
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg">
                {availableTransactions.map((t) => {
                  const isSelected = selected.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
                        isSelected
                          ? "bg-primary/10 border border-primary/30 shadow-sm"
                          : "bg-muted/30 hover:bg-muted/60 border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{t.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(t.date), "dd MMM yyyy")}
                          {getCategoryInfo(t) && ` · ${getCategoryInfo(t)}`}
                          {getAccountName(t) && ` · ${getAccountName(t)}`}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs font-bold tabular-nums flex-shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}>
                        {fmt(t.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {!showOlder && availableTransactions.length > 0 && (
              <button
                onClick={() => setShowOlder(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto mt-1"
              >
                <ChevronDown className="h-3 w-3" />
                Show older transactions
              </button>
            )}
          </div>

          {/* ── Warning Banner ─────────────────────────────────────────── */}
          {showWarning && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-600">
                  This will exceed your goal target!
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Linking these transactions brings the total spent to{" "}
                  <strong>{fmt(usedAmount + selectedTotal)}</strong> against a target of{" "}
                  <strong>{fmt(goal.target_amount)}</strong>. The goal will be marked as{" "}
                  <strong>Completed</strong>.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-lg"
                    onClick={() => setShowWarning(false)}
                  >
                    Go Back
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleLink}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm & Complete Goal"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Action Buttons ─────────────────────────────────────────── */}
          {!showWarning && (
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                Close
              </Button>
              <Button
                onClick={handleLink}
                disabled={loading || selected.size === 0}
                className="flex-1 rounded-xl font-semibold text-white"
                style={{ backgroundColor: goal.color }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Link {selected.size > 0 ? `(${selected.size})` : "Selected"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
