"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Minus, Settings2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContributeGoalDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

type Mode = "add" | "remove" | "edit";

export function ContributeGoalDialog({ goal, onClose }: ContributeGoalDialogProps) {
  const { contributeToGoal, withdrawFromGoal, updateGoal, accounts } = useAppStore();
  const [mode, setMode] = useState<Mode>("add");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editName, setEditName] = useState("");
  const [editAccountId, setEditAccountId] = useState<string>("none");
  const [editSaved, setEditSaved] = useState(false);

  // Sync edit fields when goal changes
  useEffect(() => {
    if (goal) {
      setEditName(goal.name);
      setEditAccountId(goal.account_id || "none");
      setEditSaved(false);
    }
  }, [goal?.id]);

  if (!goal) return null;

  const remaining = goal.target_amount - goal.current_amount;
  const progressPct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const maxAdd = remaining;
  const maxRemove = goal.current_amount;

  const handleAction = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError("Enter a valid amount"); return; }

    if (mode === "add") {
      if (val > maxAdd) {
        setError(`Maximum you can add is ₹${maxAdd.toLocaleString("en-IN")}`);
        return;
      }
    } else {
      if (val > maxRemove) {
        setError(`You've only saved ₹${maxRemove.toLocaleString("en-IN")} in this goal`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    if (mode === "add") {
      await contributeToGoal(goal.id, val);
    } else {
      await withdrawFromGoal(goal.id, val);
    }

    setLoading(false);
    setAmount("");
    onClose();
  };

  const handleSaveEdit = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) { setError("Goal name cannot be empty"); return; }

    setLoading(true);
    setError(null);

    const updates: Partial<Goal> = {};
    if (trimmedName !== goal.name) updates.name = trimmedName;
    const newAccountId = editAccountId === "none" ? null : editAccountId;
    if (newAccountId !== (goal.account_id || null)) updates.account_id = newAccountId;

    if (Object.keys(updates).length > 0) {
      await updateGoal(goal.id, updates);
    }

    setLoading(false);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 1500);
  };

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setAmount("");
    setError(null);
  };

  const quickAmounts = (mode === "add")
    ? [500, 1000, 2000, 5000].filter((v) => v <= maxAdd)
    : [500, 1000, 2000, 5000].filter((v) => v <= maxRemove);

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="text-2xl">{goal.icon}</span>
            {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => handleModeSwitch("add")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
                mode === "add"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
            <button
              onClick={() => handleModeSwitch("remove")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
                mode === "remove"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Minus className="h-3.5 w-3.5" />
              Remove
            </button>
            <button
              onClick={() => handleModeSwitch("edit")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
                mode === "edit"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>

          {/* ── Add / Remove Mode ─────────────────────────────────────── */}
          {(mode === "add" || mode === "remove") && (
            <>
              {/* Progress bar */}
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ backgroundColor: goal.color + "15" }}
              >
                <div className="flex justify-between text-sm font-medium">
                  <span style={{ color: goal.color }}>
                    ₹{goal.current_amount.toLocaleString("en-IN")} saved
                  </span>
                  <span className="text-muted-foreground">
                    of ₹{goal.target_amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, backgroundColor: goal.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {mode === "add"
                    ? `₹${remaining.toLocaleString("en-IN")} remaining to reach your goal`
                    : `₹${maxRemove.toLocaleString("en-IN")} available to remove`}
                </p>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  placeholder={
                    mode === "add"
                      ? `Up to ₹${maxAdd.toLocaleString("en-IN")}`
                      : `Up to ₹${maxRemove.toLocaleString("en-IN")}`
                  }
                  className="h-11 text-base"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              {/* Quick amounts */}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 font-medium transition-colors"
                    >
                      {mode === "add" ? "+" : "-"}₹{v.toLocaleString("en-IN")}
                    </button>
                  ))}
                  {/* Max shortcut */}
                  {mode === "add" && maxAdd > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(maxAdd))}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-colors"
                      style={{ backgroundColor: goal.color }}
                    >
                      Complete Goal
                    </button>
                  )}
                  {mode === "remove" && maxRemove > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(maxRemove))}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Remove All
                    </button>
                  )}
                </div>
              )}

              {/* Warning for remove mode */}
              {mode === "remove" && (
                <p className="text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
                  ⚠️ Removing funds deallocates them from this goal. Use for reallocation or corrections.
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={loading || !amount}
                  className={cn("flex-1 rounded-xl font-semibold text-white")}
                  style={{
                    backgroundColor: mode === "add" ? goal.color : undefined,
                  }}
                  variant={mode === "remove" ? "destructive" : "default"}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "add" ? (
                    "Add Funds"
                  ) : (
                    "Remove Funds"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ── Edit Mode ─────────────────────────────────────────────── */}
          {mode === "edit" && (
            <>
              {/* Goal Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Goal Name
                </Label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setError(null); setEditSaved(false); }}
                  placeholder="e.g. Emergency Fund"
                  className="h-10"
                  autoFocus
                />
              </div>

              {/* Linked Account */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Source Account
                </Label>
                <Select
                  value={editAccountId}
                  onValueChange={(val) => { setEditAccountId(val || "none"); setEditSaved(false); }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select account…">
                      {editAccountId === "none"
                        ? "No account linked"
                        : accounts.find((a) => a.id === editAccountId)?.name || "Select account…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No account linked</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={loading || editSaved}
                  className="flex-1 rounded-xl font-semibold text-white"
                  style={{ backgroundColor: editSaved ? "#22c55e" : goal.color }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editSaved ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
