"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Download, User, LogOut, Smartphone, MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { isDarkMode, toggleDarkMode, transactions, accounts, smsSenderMappings, addSmsSenderMapping, deleteSmsSenderMapping } = useAppStore();
  const router = useRouter();
  const supabase = createClient();
  const [isNative, setIsNative] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // New sender mapping form state
  const [newSender, setNewSender] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingMapping, setAddingMapping] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform());
      setSmsEnabled(localStorage.getItem("xylem_sms_enabled") === "true");
    });
  }, []);

  const handleSmsToggle = async () => {
    try {
      const { registerPlugin } = await import("@capacitor/core");
      const SmsTracker: any = registerPlugin("SmsTracker");
      const newState = !smsEnabled;

      if (newState) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { alert("Please sign in before enabling SMS tracking."); return; }

        // Extract allowed sender patterns from the user's configured mappings
        const allowedSenders = smsSenderMappings.map((m) => m.sender_pattern);
        if (allowedSenders.length === 0) {
          alert("Please add at least one SMS sender mapping before enabling tracking.");
          return;
        }

        // Pass token, userId, AND allowedSenders directly to the Java plugin
        const perms: any = await SmsTracker.requestSmsPermission({
          token: session.access_token,
          userId: session.user.id,
          allowedSenders: allowedSenders.join(","),
        });

        if (perms.granted) {
          setSmsEnabled(true);
          localStorage.setItem("xylem_sms_enabled", "true");
        } else {
          alert("SMS permission denied by the OS.");
        }
      } else {
        await SmsTracker.clearSmsCredentials();
        setSmsEnabled(false);
        localStorage.setItem("xylem_sms_enabled", "false");
      }
    } catch (e: any) {
      alert("Native Bridge Error: " + (e.message || JSON.stringify(e)));
      console.error("Native Bridge Error", e);
    }
  };

  const testSmsWebhook = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert("Not signed in."); return; }
      // Use first configured sender if available, otherwise TEST-BANK
      const sender = smsSenderMappings[0]?.sender_pattern ?? "TEST-BANK";
      const res = await fetch("/api/webhooks/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender,
          message: "INR 250.00 debited from your account. Available bal: INR 10000.00.",
          token: session.access_token,
          userId: session.user.id,
        }),
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("✅ Test passed! Check SMS Review tab — a ₹250 debit should appear for review.");
      } else {
        alert("❌ Webhook error: " + JSON.stringify(result));
      }
    } catch (e: any) {
      alert("❌ Test failed: " + e.message);
    }
  };

  const handleAddMapping = async () => {
    if (!newSender.trim()) return;
    setAddingMapping(true);
    await addSmsSenderMapping({
      sender_pattern: newSender.trim().toUpperCase(),
      account_id: newAccountId || null,
      label: newLabel.trim() || undefined,
    });
    setNewSender("");
    setNewAccountId("");
    setNewLabel("");
    setAddingMapping(false);
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
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account &amp; preferences</p>
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
          <Button variant="destructive" className="w-full rounded-xl gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
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

      {/* Native Integration — only visible inside Android App */}
      {isNative && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Smartphone className="h-4 w-4" /> Native Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SMS Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> SMS Auto-Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {smsSenderMappings.length === 0
                    ? "Add sender mappings below before enabling."
                    : `Tracking ${smsSenderMappings.length} sender(s).`}
                </p>
              </div>
              <button
                onClick={handleSmsToggle}
                disabled={smsSenderMappings.length === 0}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors flex-shrink-0 disabled:opacity-40",
                  smsEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", smsEnabled ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>

            {smsEnabled && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Service Active
                </p>
                <button
                  onClick={testSmsWebhook}
                  className="w-full text-xs py-1.5 px-3 rounded-lg border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                >
                  🧪 Send Test Transaction (debug)
                </button>
              </div>
            )}

            <Separator />

            {/* Sender Mappings */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SMS Sender Mappings</p>
              <p className="text-xs text-muted-foreground -mt-1">
                Map sender names to bank accounts. Only listed senders will be tracked.
              </p>

              {/* Existing mappings */}
              {smsSenderMappings.length > 0 && (
                <div className="space-y-2">
                  {smsSenderMappings.map((m) => {
                    const account = accounts.find((a) => a.id === m.account_id);
                    return (
                      <div key={m.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-bold font-mono">{m.sender_pattern}</p>
                          <p className="text-[11px] text-muted-foreground">{account?.name ?? "No account linked"}</p>
                        </div>
                        <button
                          onClick={() => deleteSmsSenderMapping(m.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add new mapping form */}
              <div className="space-y-2 pt-1">
                <Input
                  placeholder="Sender pattern (e.g. BOBSMS)"
                  value={newSender}
                  onChange={(e) => setNewSender(e.target.value.toUpperCase())}
                  className="h-8 text-xs font-mono"
                />
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Link to account (optional)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAddMapping}
                  disabled={!newSender.trim() || addingMapping}
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Sender
                </Button>
              </div>
            </div>
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
          <p className="text-xs text-muted-foreground mt-0.5">Built with Next.js, Supabase &amp; ❤️</p>
        </CardContent>
      </Card>
    </div>
  );
}
