"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

const EMOJI_OPTIONS = ["🍕", "🛒", "🚗", "🏠", "⚡", "🛍️", "🏥", "🎬", "📚", "🔄", "🏦", "✨", "🎁", "💼", "💻", "📈", "💰", "📦", "🎮", "✈️", "☕", "🐕", "🏋️", "💊"];
const COLOR_OPTIONS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#78716c"];

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, categoryRules, addCategoryRule, deleteCategoryRule } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "📦", color: "#3b82f6", type: "expense" as "expense" | "income" | "both" });
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");

  // Rule engine form state
  const [ruleKeyword, setRuleKeyword] = useState("");
  const [ruleCategoryId, setRuleCategoryId] = useState("");

  const filtered = categories.filter((c) => filter === "all" || c.type === filter || c.type === "both");

  const openEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setEditId(id);
      setForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
      setDialogOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editId) {
      updateCategory(editId, form);
    } else {
      addCategory(form);
    }
    setDialogOpen(false);
    setEditId(null);
    setForm({ name: "", icon: "📦", color: "#3b82f6", type: "expense" });
  };

  const handleAddRule = () => {
    if (!ruleKeyword || !ruleCategoryId) return;
    addCategoryRule({ keyword: ruleKeyword.trim(), category_id: ruleCategoryId, match_type: "contains" });
    setRuleKeyword("");
    setRuleCategoryId("");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ name: "", icon: "📦", color: "#3b82f6", type: "expense" }); setDialogOpen(true); }} size="sm" className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "expense", "income"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cat) => (
          <Card key={cat.id} className="group hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg flex-shrink-0"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{cat.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{cat.type}</p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!cat.is_system && (
                    <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight mb-1">Smart Auto-Tagging</h2>
          <p className="text-sm text-muted-foreground">Define keywords. Any CSV import that contains these words will automatically route to the set category.</p>
        </div>
        
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end bg-muted/20">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When description contains...</Label>
              <Input 
                placeholder="e.g. 'swiggy' or 'zomato'" 
                value={ruleKeyword} 
                onChange={(e) => setRuleKeyword(e.target.value)} 
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign to Category</Label>
              <select
                value={ruleCategoryId}
                onChange={(e) => setRuleCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled className="bg-background text-foreground">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-foreground">{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddRule} disabled={!ruleKeyword || !ruleCategoryId}>
              Add Rule
            </Button>
          </CardContent>
        </Card>

        {categoryRules.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryRules.map((rule) => {
              const rootCat = categories.find(c => c.id === rule.category_id);
              return (
                <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card shadow-sm">
                  <div className="min-w-0 flex-1 flex flex-col">
                    <span className="text-sm font-bold truncate">"{rule.keyword}"</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Tags className="h-3 w-3" />
                      {rootCat ? `${rootCat.icon} ${rootCat.name}` : "Unknown"}
                    </span>
                  </div>
                  <button onClick={() => deleteCategoryRule(rule.id)} className="p-2 ml-2 flex-shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon</Label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm({ ...form, icon: e })}
                    className={cn(
                      "h-9 w-9 rounded-lg text-base flex items-center justify-center border transition-all",
                      form.icon === e ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input placeholder="e.g. Pet Care" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
              <div className="flex gap-2">
                {(["expense", "income", "both"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize",
                      form.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: form.color + "20" }}>
                {form.icon}
              </div>
              <span className="font-medium text-sm">{form.name || "Category Name"}</span>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!form.name}>
              {editId ? "Update" : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
