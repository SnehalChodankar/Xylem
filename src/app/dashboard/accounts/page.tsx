"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; type: "bank" | "credit_card" | "cash" | "wallet" | "other"; balance: string; icon: string; color: string }>({ name: "", type: "bank", balance: "", icon: "🏦", color: "#3b82f6" });

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

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
        <Button onClick={() => { setEditId(null); setForm({ name: "", type: "bank", balance: "", icon: "🏦", color: "#3b82f6" }); setDialogOpen(true); }} size="sm" className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      {/* Total Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Net Worth</span>
          </div>
          <p className={cn("text-3xl font-bold", totalBalance >= 0 ? "text-foreground" : "text-red-500")}>
            {formatCurrency(totalBalance)}
          </p>
        </CardContent>
      </Card>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="group hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: acc.color + "20" }}>
                    {acc.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{acc.type.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(acc.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className={cn("text-xl font-bold tabular-nums", acc.balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Account" : "Add Account"}</DialogTitle>
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
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <Input type="number" placeholder="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="pl-8" />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!form.name || !form.balance}>
              {editId ? "Update" : "Add Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
