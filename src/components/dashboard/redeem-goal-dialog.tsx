"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Banknote, PartyPopper, ChevronDown } from "lucide-react";

interface RedeemGoalDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

export function RedeemGoalDialog({ goal, onClose }: RedeemGoalDialogProps) {
  const { redeemGoal, categories } = useAppStore();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const maxAmount = goal.current_amount;
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  const handleRedeem = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (val > maxAmount) {
      setError(`Maximum you can withdraw is ₹${maxAmount.toLocaleString("en-IN")}`);
      return;
    }

    setLoading(true);
    setError(null);

    const desc = description.trim() || `🎯 Goal Redeemed: ${goal.name}`;
    await redeemGoal(goal.id, val, desc, categoryId || undefined);

    setLoading(false);
    setAmount("");
    setDescription("");
    setCategoryId("");
    onClose();
  };

  const quickAmounts = [1000, 2000, 5000, 10000].filter((v) => v <= maxAmount);
  const isFullWithdrawal = parseFloat(amount) >= maxAmount && maxAmount > 0;

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="text-2xl">{goal.icon}</span>
            Withdraw Funds — {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Success banner */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ backgroundColor: goal.color + "15" }}
          >
            <PartyPopper className="h-8 w-8 flex-shrink-0" style={{ color: goal.color }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: goal.color }}>
                🎉 Target Reached!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've saved <strong>₹{goal.current_amount.toLocaleString("en-IN")}</strong> of ₹{goal.target_amount.toLocaleString("en-IN")}.
                Withdraw your funds to use them.
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Withdrawal Amount (₹)
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null); }}
              placeholder={`Up to ₹${maxAmount.toLocaleString("en-IN")}`}
              className="h-11 text-base"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 font-medium transition-colors"
              >
                ₹{v.toLocaleString("en-IN")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(maxAmount))}
              className="px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: goal.color }}
            >
              Withdraw All
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Transaction Description
            </Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`🎯 Goal Redeemed: ${goal.name}`}
              className="h-10"
            />
          </div>

          {/* Category selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Category
            </Label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category (optional)</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Full withdrawal info */}
          {isFullWithdrawal && (
            <p className="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">
              ✅ Full withdrawal — this goal will be marked as <strong>Completed</strong> and a debit transaction of ₹{maxAmount.toLocaleString("en-IN")} will be created.
            </p>
          )}

          {/* Partial withdrawal info */}
          {!isFullWithdrawal && parseFloat(amount) > 0 && (
            <p className="text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
              ⚡ Partial withdrawal — the goal will remain active with ₹{(maxAmount - parseFloat(amount)).toLocaleString("en-IN")} remaining.
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-xl font-semibold text-white"
              style={{ backgroundColor: goal.color }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Banknote className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
