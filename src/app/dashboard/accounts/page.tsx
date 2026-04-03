"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Wallet, GitCompareArrows, CheckCircle2, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, getLiveAccountBalance, reconcileAccount } = useAppStore();

  // ── Add/Edit dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    type: "bank" | "credit_card" | "cash" | "wallet" | "other";
    balance: string;
    icon: string;
    color: string;
  }>({ name: "", type: "bank", balance: "", icon: "🏦", color: "#3b82f6" });

  // ── Reconciliation dialog state ──
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileAccountId, setReconcileAccountId] = useState<string | null>(null);
  const [realBalanceInput, setRealBalanceInput] = useState("");
  const [reconciling, setReconciling] = useState(false);
  const [reconcileDone, setReconcileDone] = useState(false);

  const reconcileTarget = reconcileAccountId ? accounts.find((a) => a.id === reconcileAccountId) : null;
  const xylemBalance = reconcileAccountId ? getLiveAccountBalance(reconcileAccountId) : 0;
  const realBalanceNum = parseFloat(realBalanceInput) || 0;
  const discrepancy = realBalanceInput !== "" ? realBalanceNum - xylemBalance : null;

  // Compute total live balance across all accounts
  const totalLiveBalance = accounts.reduce((sum, a) => sum + getLiveAccountBalance(a.id), 0);

  const openEdit = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (acc) {
      setEditId(id);
      setForm({ name: acc.name, type: acc.type, balance: acc.balance.toString(), icon: acc.icon || "🏦", color: acc.color || "#3b82f6" });
      setDialogOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.balance) return;
    if (editId) {
      updateAccount(editId, { name: form.name, type: form.type, balance: parseFloat(form.balance), icon: form.icon, color: form.color });
    } else {
      addAccount({ name: form.name, type: form.type, balance: parseFloat(form.balance), icon: form.icon, color: form.color });
    }
    setDialogOpen(false);
    setEditId(null);
    setForm({ name: "", type: "bank", balance: "", icon: "🏦", color: "#3b82f6" });
  };

  const openReconcile = (id: string) => {
    setReconcileAccountId(id);
    setRealBalanceInput("");
    setReconcileDone(false);
    setReconcileOpen(true);
  };

  const handleReconcile = async () => {
    if (!reconcileAccountId || realBalanceInput === "") return;
    setReconciling(true);
    await reconcileAccount(reconcileAccountId, realBalanceNum);
    setReconciling(false);
    setReconcileDone(true);
  };

  const accountIcons = ["🏦", "💳", "💵", "📱", "💰", "🏧", "💎"];
  const accountTypes = [
    { value: "bank", label: "Bank Account" },
    { value: "credit_card", label: "Credit Card" },
    { value: "cash", label: "Cash" },
    { value: "wallet", label: "Digital Wallet" },
    { value: "other", label: "Other" },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your financial accounts</p>
        </div>
        <Button
          onClick={() => { setEditId(null); setForm({ name: "", type: "bank", balance: "", icon: "🏦", color: "#3b82f6" }); setDialogOpen(true); }}
          size="sm"
          className="rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      {/* Total Live Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Net Worth (Live)</span>
          </div>
          <p className={cn("text-3xl font-bold", totalLiveBalance >= 0 ? "text-foreground" : "text-red-500")}>
            {formatCurrency(totalLiveBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Auto-synced from your transaction ledger</p>
        </CardContent>
      </Card>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const liveBalance = getLiveAccountBalance(acc.id);
          const hasChanged = Math.abs(liveBalance - acc.balance) > 0.01;
          const drift = liveBalance - acc.balance;
          return (
            <Card key={acc.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: (acc.color || "#3b82f6") + "20" }}
                    >
                      {acc.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{acc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{acc.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openReconcile(acc.id)}
                      title="Reconcile with bank"
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                    >
                      <GitCompareArrows className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openEdit(acc.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border space-y-1">
                  {/* Live balance */}
                  <p className={cn("text-xl font-bold tabular-nums", liveBalance >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {formatCurrency(liveBalance)}
                  </p>
                  {/* Drift from opening balance */}
                  {hasChanged && (
                    <div className={cn("flex items-center gap-1 text-xs font-medium", drift >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {drift >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span>{drift >= 0 ? "+" : ""}{formatCurrency(drift)} from opening balance</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Add/Edit Account Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Account" : "Add Account"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Update the account details. The opening balance will be preserved as a baseline."
                : "Set the current balance of this account. This is your opening balance — future transactions will be tracked on top of it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon</Label>
              <div className="flex gap-2">
                {accountIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={cn(
                      "h-10 w-10 rounded-xl text-lg flex items-center justify-center border transition-all",
                      form.icon === icon ? "border-primary bg-primary/10 shadow-sm" : "border-border"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input placeholder="e.g. HDFC Savings" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
              <div className="flex flex-wrap gap-2">
                {accountTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {editId ? "Opening Balance" : "Current Balance"}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!form.name || !form.balance}>
              {editId ? "Update" : "Add Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reconciliation Dialog ─── */}
      <Dialog open={reconcileOpen} onOpenChange={(open) => { setReconcileOpen(open); if (!open) setReconcileDone(false); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5 text-primary" />
              Reconcile — {reconcileTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Compare your Xylem ledger balance with your actual bank balance. Any difference will be automatically corrected with an adjusting transaction.
            </DialogDescription>
          </DialogHeader>

          {reconcileDone ? (
            <div className="py-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <p className="font-semibold text-base">Account Reconciled!</p>
              <p className="text-sm text-muted-foreground">
                An adjusting transaction has been added to your ledger. Your Xylem balance now matches your actual bank balance.
              </p>
              <Button className="w-full mt-2 rounded-xl" onClick={() => setReconcileOpen(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/30 p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Xylem Balance</p>
                  <p className={cn("text-xl font-bold tabular-nums", xylemBalance >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {formatCurrency(xylemBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">From your ledger</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bank Balance</p>
                  <p className={cn("text-xl font-bold tabular-nums", realBalanceInput === "" ? "text-muted-foreground" : realBalanceNum >= 0 ? "text-primary" : "text-red-500")}>
                    {realBalanceInput === "" ? "—" : formatCurrency(realBalanceNum)}
                  </p>
                  <p className="text-xs text-muted-foreground">Your actual bank</p>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enter Your Actual Bank Balance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    placeholder="e.g. 52450"
                    value={realBalanceInput}
                    onChange={(e) => setRealBalanceInput(e.target.value)}
                    className="pl-8"
                    autoFocus
                  />
                </div>
              </div>

              {/* Discrepancy preview */}
              {discrepancy !== null && (
                <div className={cn(
                  "rounded-xl border p-4 space-y-1",
                  Math.abs(discrepancy) < 0.01
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                )}>
                  {Math.abs(discrepancy) < 0.01 ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-sm font-semibold">Your accounts are in perfect sync!</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-semibold">Discrepancy found</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {discrepancy > 0
                          ? `Your bank has ₹${Math.abs(discrepancy).toFixed(2)} more than Xylem. A credit adjustment will be added.`
                          : `Your bank has ₹${Math.abs(discrepancy).toFixed(2)} less than Xylem. A debit adjustment will be added.`}
                      </p>
                    </>
                  )}
                </div>
              )}

              <Button
                className="w-full rounded-xl"
                onClick={handleReconcile}
                disabled={realBalanceInput === "" || (discrepancy !== null && Math.abs(discrepancy) < 0.01) || reconciling}
              >
                {reconciling ? "Applying Adjustment..." : discrepancy !== null && Math.abs(discrepancy) < 0.01 ? "Already Synced" : "Apply Adjusting Transaction"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
