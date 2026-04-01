"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthName } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Target } from "lucide-react";

export default function BudgetsPage() {
  const {
    selectedMonth, selectedYear, categories, budgets,
    getBudgetProgress, addBudget, updateBudget, deleteBudget,
  } = useAppStore();
  const progress = getBudgetProgress(selectedMonth, selectedYear);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const budgetedCategoryIds = budgets
    .filter((b) => b.month === selectedMonth && b.year === selectedYear)
    .map((b) => b.category_id);
  const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.includes(c.id));

  const totalBudget = progress.reduce((s, b) => s + b.amount, 0);
  const totalSpent = progress.reduce((s, b) => s + b.spent, 0);
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleSubmit = () => {
    if (!formCategoryId || !formAmount) return;
    if (editId) {
      updateBudget(editId, { amount: parseFloat(formAmount) });
    } else {
      addBudget({
        category_id: formCategoryId,
        amount: parseFloat(formAmount),
        month: selectedMonth,
        year: selectedYear,
      });
    }
    setAddOpen(false);
    setEditId(null);
    setFormCategoryId("");
    setFormAmount("");
  };

  const openEdit = (budgetId: string) => {
    const b = budgets.find((x) => x.id === budgetId);
    if (b) {
      setEditId(budgetId);
      setFormCategoryId(b.category_id);
      setFormAmount(b.amount.toString());
      setAddOpen(true);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>
        <Button onClick={() => { setEditId(null); setFormCategoryId(""); setFormAmount(""); setAddOpen(true); }} size="sm" className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Set Budget
        </Button>
      </div>

      {/* Overall Progress */}
      {progress.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Overall Budget</span>
              </div>
              <span className={cn(
                "text-sm font-bold",
                totalPercent > 100 ? "text-red-500" : totalPercent > 80 ? "text-amber-500" : "text-emerald-500"
              )}>
                {totalPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  totalPercent > 100 ? "bg-red-500" : totalPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(totalPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Spent: <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span></span>
              <span>Budget: <span className="font-semibold text-foreground">{formatCurrency(totalBudget)}</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      {progress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Target className="h-12 w-12 mb-4 text-muted-foreground/40" />
          <p className="font-medium">No budgets set for this month</p>
          <p className="text-sm mt-1">Set category budgets to track your spending</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.map((budget) => {
            const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const isOver = budget.spent > budget.amount;
            const isWarning = percent >= 80 && !isOver;
            const remaining = budget.amount - budget.spent;

            return (
              <Card key={budget.id} className={cn(
                "group transition-all hover:shadow-md",
                isOver ? "border-red-500/30" : isWarning ? "border-amber-500/30" : ""
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">
                        {budget.category?.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{budget.category?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isOver ? "Over budget!" : `${formatCurrency(Math.abs(remaining))} remaining`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(budget.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteBudget(budget.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatCurrency(budget.spent)} spent</span>
                    <span className="font-medium">{formatCurrency(budget.amount)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Budget" : "Set Budget"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategoryId(cat.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        formCategoryId === cat.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Budget Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="pl-8 text-lg font-bold h-12"
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl h-11" disabled={!formCategoryId || !formAmount}>
              {editId ? "Update Budget" : "Set Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
