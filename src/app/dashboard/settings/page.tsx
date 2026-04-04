"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Download, User, LogOut, Smartphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";


export default function SettingsPage() {
  const { isDarkMode, toggleDarkMode, transactions } = useAppStore();
  const router = useRouter();
  const supabase = createClient();
  const [isNative, setIsNative] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform());
      // In a real flow, you would ping a Capacitor plugin or local storage to see if permission was already granted previously
      setSmsEnabled(localStorage.getItem("xylem_sms_enabled") === "true");
    });
  }, []);

  const handleSmsToggle = async () => {
    try {
      const { registerPlugin } = await import("@capacitor/core");
      const SmsTracker: any = registerPlugin("SmsTracker");
      const newState = !smsEnabled;

      if (newState) {
        // Fetch the active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert("Please sign in before enabling SMS tracking.");
          return;
        }

        // Pass token + userId DIRECTLY into the Java plugin method.
        // The plugin writes them to Android SharedPreferences (XylemPrefs)
        // so the background SmsReceiver can read them without any Capacitor Prefs ambiguity.
        const perms: any = await SmsTracker.requestSmsPermission({
          token: session.access_token,
          userId: session.user.id,
        });

        if (perms.granted) {
          setSmsEnabled(true);
          localStorage.setItem("xylem_sms_enabled", "true");
        } else {
          alert("SMS permission denied by the OS.");
        }
      } else {
        // Clear credentials from native storage via Java plugin
        await SmsTracker.clearSmsCredentials();
        setSmsEnabled(false);
        localStorage.setItem("xylem_sms_enabled", "false");
      }
    } catch (e: any) {
      alert("Native Bridge Error: " + (e.message || JSON.stringify(e)));
      console.error("Native Bridge Error", e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
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

      {/* Native Capability Bridge (Only renders inside Android App runtime) */}
      {isNative && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Smartphone className="h-4 w-4" /> Native Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> SMS Auto-Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically scan incoming bank SMS messages and add them directly to your ledger.</p>
              </div>
              <button
                onClick={handleSmsToggle}
                className={cn("relative h-7 w-12 rounded-full transition-colors flex-shrink-0", smsEnabled ? "bg-primary" : "bg-muted")}
              >
                <div className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", smsEnabled ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            {smsEnabled && (
              <p className="text-[10px] uppercase font-bold text-emerald-500 mt-3 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Service Active</p>
            )}
          </CardContent>
        </Card>
      )}

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
