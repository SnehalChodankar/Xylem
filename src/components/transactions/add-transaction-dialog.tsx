"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function AddTransactionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { categories, accounts, addTransaction } = useAppStore();
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "debit" ? "expense" : "income") || c.type === "both"
  );

  // Use first available account as default when accounts load
  const effectiveAccountId = accountId || accounts[0]?.id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setSaving(true);
    await addTransaction({
      type,
      amount: parseFloat(amount),
      description,
      category_id: categoryId || undefined,
      account_id: effectiveAccountId || undefined,
      date,
      payment_method: paymentMethod,
      notes: notes || undefined,
      import_source: "manual",
    });
    setSaving(false);

    // Reset form
    setAmount("");
    setDescription("");
    setCategoryId("");
    setNotes("");
    onOpenChange(false);
  };

  const paymentMethods = ["UPI", "Cash", "Card", "NetBanking", "Cheque", "Other"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => { setType("debit"); setCategoryId(""); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                type === "debit"
                  ? "bg-red-500/15 text-red-500 dark:text-red-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => { setType("credit"); setCategoryId(""); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                type === "credit"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              💰 Income
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-2xl font-bold h-14 text-center"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
            <Input
              id="desc"
              placeholder={type === "debit" ? "e.g., Swiggy dinner order" : "e.g., Monthly salary"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Date and Account */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</Label>
              <select
                id="account"
                value={effectiveAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts yet</option>
                ) : (
                  accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No categories yet — add some in the Categories page.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      categoryId === cat.id
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</Label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    paymentMethod === pm
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={saving || !amount || !description}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all",
              type === "debit"
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
            )}
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              type === "debit" ? "Add Expense" : "Add Income"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
