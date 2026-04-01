"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Download, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { isDarkMode, toggleDarkMode, transactions } = useAppStore();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const exportCSV = () => {
    const headers = ["Date", "Description", "Type", "Amount", "Category ID", "Payment Method", "Notes"];
    const rows = transactions.map((t) => [
      t.date,
      `"${t.description}"`,
      t.type,
      t.amount,
      t.category_id || "",
      t.payment_method || "",
      `"${t.notes || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    // UTF-8 BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintrack-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account & preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">👤</div>
            <div>
              <p className="font-semibold">Signed In</p>
              <p className="text-sm text-muted-foreground">Your data is synced with Supabase</p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full rounded-xl gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {isDarkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={cn("relative h-7 w-12 rounded-full transition-colors", isDarkMode ? "bg-primary" : "bg-muted")}
            >
              <div className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", isDarkMode ? "translate-x-5" : "translate-x-0.5")} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Transactions</p>
              <p className="text-xs text-muted-foreground">Download all as CSV (Excel compatible)</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Transactions</p>
              <p className="text-xs text-muted-foreground">{transactions.length} transactions stored</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Xylem Finance" className="h-12 w-auto object-contain mx-auto mb-2" />
          <p className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Xylem Finance</p>
          <p className="text-xs text-muted-foreground mt-1">Personal Finance Tracker v1.0</p>
          <p className="text-xs text-muted-foreground mt-0.5">Built with Next.js, Supabase & ❤️</p>
        </CardContent>
      </Card>
    </div>
  );
}
