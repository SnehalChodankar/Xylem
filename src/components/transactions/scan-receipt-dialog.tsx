"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Camera, Upload, Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";

interface OcrResult {
  amount: number;
  description: string;
  date: string;
  type: "debit" | "credit";
  merchant: string;
  category_hint: string;
}

export function ScanReceiptDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { categories, accounts, addTransaction } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for review
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setStep("upload");
    setImagePreview(null);
    setOcrData(null);
    setError(null);
    setAmount("");
    setDescription("");
    setDate("");
    setType("debit");
    setCategoryId("");
    setAccountId("");
    setSaving(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      await processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Image: string) => {
    setStep("processing");
    setError(null);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const result = await res.json();

      if (result.error) throw new Error(result.error);

      const data = result.data as OcrResult;
      setOcrData(data);

      // Pre-fill editable fields
      setAmount(String(data.amount || ""));
      setDescription(data.description || "");
      setDate(data.date || new Date().toISOString().split("T")[0]);
      setType(data.type === "credit" ? "credit" : "debit");

      // Try to auto-match category from the hint
      if (data.category_hint) {
        const hint = data.category_hint.toLowerCase();
        const match = categories.find(
          (c) => c.name.toLowerCase().includes(hint) || hint.includes(c.name.toLowerCase())
        );
        if (match) setCategoryId(match.id);
      }

      setStep("review");
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || "Failed to scan receipt.");
      setStep("upload");
    }
  };

  const handleConfirm = async () => {
    if (!amount || !description) return;

    setSaving(true);
    await addTransaction({
      type,
      amount: parseFloat(amount),
      description,
      date,
      category_id: categoryId || undefined,
      account_id: accountId || undefined,
      payment_method: "Cash",
      notes: ocrData?.merchant ? `Scanned from receipt — ${ocrData.merchant}` : "Scanned from receipt",
      import_source: "manual",
    });
    setSaving(false);
    resetState();
    onOpenChange(false);
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "debit" ? "expense" : "income") || c.type === "both"
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2">
                <X className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Receipt" className="max-h-48 rounded-xl object-contain" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Tap to capture or upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Take a photo of your receipt or bill</p>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Powered by Gemini AI Vision. Your image is processed securely and never stored.
            </p>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="Receipt" className="max-h-32 rounded-xl object-contain opacity-60" />
            )}
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Analyzing receipt with AI...</span>
            </div>
          </div>
        )}

        {/* Step 3: Review & Edit */}
        {step === "review" && ocrData && (
          <div className="space-y-4 pt-2">
            {/* AI confidence banner */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Receipt scanned! Review and confirm the details below.
            </div>

            {/* Mini receipt preview */}
            {imagePreview && (
              <div className="flex justify-center">
                <img src={imagePreview} alt="Receipt" className="max-h-24 rounded-lg object-contain opacity-70 border" />
              </div>
            )}

            {/* Type toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => { setType("debit"); setCategoryId(""); }}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
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
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                  type === "credit"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                💰 Income
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-2xl font-bold h-14 text-center"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date & Account */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</Label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
                {ocrData.category_hint && (
                  <span className="ml-2 text-[10px] text-amber-500 normal-case font-normal">AI suggests: {ocrData.category_hint}</span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto py-1">
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
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => { resetState(); }}
                className="flex-1 rounded-xl"
              >
                Rescan
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={saving || !amount || !description}
                className={cn(
                  "flex-1 rounded-xl font-semibold shadow-lg",
                  type === "debit"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Confirm
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
