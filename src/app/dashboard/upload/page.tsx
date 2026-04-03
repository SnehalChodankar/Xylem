"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { CATEGORY_RULES } from "@/lib/demo-data";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  selected: boolean;
  category_id?: string;
}

export default function UploadPage() {
  const { categories, importTransactions } = useAppStore();
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const autoCategorize = (desc: string): string | undefined => {
    const lower = desc.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      if (lower.includes(rule.keyword)) {
        // Find the real Supabase UUID for this category name
        const cat = categories.find(
          (c) => c.name.toLowerCase() === rule.categoryName.toLowerCase()
        );
        return cat?.id;
      }
    }
    return undefined;
  };

  const parseCSV = (content: string) => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const results: ParsedTransaction[] = [];

    // Try to detect format
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma (handle quoted fields)
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
      if (cols.length < 3) continue;

      // Try to parse: Date, Description, Debit, Credit, Balance (common Indian bank format)
      let date = "";
      let description = "";
      let debitAmt = 0;
      let creditAmt = 0;

      if (cols.length >= 5) {
        // HDFC-style: Date, Narration, Chq/Ref, Value Dt, Withdrawal, Deposit, Balance
        date = cols[0];
        description = cols[1];
        const col4 = parseFloat(cols[cols.length - 3]?.replace(/,/g, "")) || 0;
        const col5 = parseFloat(cols[cols.length - 2]?.replace(/,/g, "")) || 0;
        debitAmt = col4;
        creditAmt = col5;
      } else if (cols.length >= 3) {
        date = cols[0];
        description = cols[1];
        const amount = parseFloat(cols[2]?.replace(/,/g, "")) || 0;
        if (amount < 0) debitAmt = Math.abs(amount);
        else creditAmt = amount;
      }

      // Parse date
      const parsedDate = parseDate(date);
      if (!parsedDate || (!debitAmt && !creditAmt)) continue;

      const type = debitAmt > 0 ? "debit" : "credit";
      const amount = debitAmt || creditAmt;

      results.push({
        date: parsedDate,
        description,
        amount,
        type,
        selected: true,
        category_id: autoCategorize(description),
      });
    }

    return results;
  };

  const parseDate = (dateStr: string): string | null => {
    // Try DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const formats = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    ];
    
    for (const fmt of formats) {
      const match = dateStr.match(fmt);
      if (match) {
        let y, m, d;
        if (match[3]?.length === 4) { d = match[1]; m = match[2]; y = match[3]; }
        else { y = match[1]; m = match[2]; d = match[3]; }
        const date = new Date(parseInt(y!), parseInt(m!) - 1, parseInt(d!));
        if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
      }
    }
    return null;
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const results = parseCSV(content);
      setParsed(results);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    }
  }, []);

  const handleImport = () => {
    const selected = parsed.filter((t) => t.selected);
    importTransactions(
      selected.map((t) => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        category_id: t.category_id,
        import_source: "csv_upload" as const,
      }))
    );
    setImportCount(selected.length);
    setStep("done");
  };

  const toggleAll = (selected: boolean) => {
    setParsed((p) => p.map((t) => ({ ...t, selected })));
  };

  if (step === "done") {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Import Complete!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Successfully imported {importCount} transactions from {fileName}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep("upload"); setParsed([]); }} className="rounded-xl">
              Upload Another
            </Button>
            <Button onClick={() => window.location.href = "/dashboard/transactions"} className="rounded-xl">
              View Transactions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const selectedCount = parsed.filter((t) => t.selected).length;
    return (
      <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Preview Import</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {parsed.length} transactions found in {fileName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep("upload"); setParsed([]); }} size="sm" className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleImport} size="sm" className="rounded-xl gap-1.5" disabled={selectedCount === 0}>
              Import {selectedCount}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleAll(true)} className="text-xs">Select All</Button>
          <Button variant="outline" size="sm" onClick={() => toggleAll(false)} className="text-xs">Deselect All</Button>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-border max-h-[60vh] overflow-y-auto">
            {parsed.map((txn, i) => {
              const cat = categories.find((c) => c.id === txn.category_id);
              return (
                <div
                  key={i}
                  onClick={() => setParsed((p) => p.map((t, j) => j === i ? { ...t, selected: !t.selected } : t))}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                    txn.selected ? "bg-primary/5" : "opacity-50"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0",
                    txn.selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}>
                    {txn.selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{txn.date}</span>
                      {cat && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{cat.icon} {cat.name}</Badge>
                      )}
                      {!cat && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-500 border-amber-500/30">Uncategorized</Badge>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
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
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Upload Bank Statement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Import transactions from your bank&apos;s CSV export
        </p>
      </div>

      {/* Safety Disclaimer */}
      <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
        <CardContent className="p-4 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Privacy & Security Notice</p>
            <p className="text-xs text-amber-800/70 dark:text-amber-500/70 leading-relaxed">
              Xylem processes your data to extract transaction details. Before uploading, 
              ensure your CSV file does NOT contain sensitive information like passwords, 
              full account numbers, or personal identity numbers. 
              <span className="block mt-1 font-semibold">User assumes all liability for uploaded data.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Drop your CSV file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          </div>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Supported Banks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Supported Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Generic CSV"].map((bank) => (
              <div key={bank} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                {bank}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Download your bank statement as CSV from your net banking portal. 
            The app will auto-detect the format and categorize transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
