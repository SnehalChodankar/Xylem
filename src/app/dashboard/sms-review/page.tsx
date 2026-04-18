"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { SmsTransaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp, Inbox, RefreshCcw, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
import { Capacitor, registerPlugin } from "@capacitor/core";

const SmsTracker = registerPlugin<any>("SmsTracker");

export default function SmsReviewPage() {
  const { smsTransactions, accounts, categories, approveSmsTransaction, rejectSmsTransaction, fetchData } = useAppStore();
  const pending = smsTransactions.filter((t) => t.status === "pending");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      if (!Capacitor.isNativePlatform()) {
        setSyncMessage({ type: 'error', text: "SMS sync is only available natively on the Android app." });
        setSyncing(false);
        return;
      }

      if (!SmsTracker) throw new Error("SMS Plugin not found.");

      // Attempt to sync todays SMS list via Java plugin
      const result = await SmsTracker.syncTodaySms();
      const messages = result.messages || [];

      if (messages.length === 0) {
        setSyncMessage({ type: 'success', text: "No bank SMS found in your inbox for today." });
        setSyncing(false);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const res = await fetch("/api/webhooks/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: session.access_token,
          userId: session.user.id,
          messages
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Refresh store to pull newly inserted pending SMS
      await fetchData();
      
      setSyncMessage({ 
        type: 'success', 
        text: `Successfully scanned ${messages.length} SMS. Discovered ${data.count || 0} valid banking transactions.` 
      });
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ type: 'error', text: "Failed to sync SMS: " + err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            SMS Review Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review bank SMS transactions before adding them to your ledger.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="rounded-xl font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Sync Today's SMS
        </Button>
      </div>

      {syncMessage && (
        <div className={cn("p-4 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2", 
          syncMessage.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        )}>
          <span>{syncMessage.text}</span>
          <button onClick={() => setSyncMessage(null)}><X className="h-4 w-4 opacity-70 hover:opacity-100 transition-opacity" /></button>
        </div>
      )}

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground space-y-3">
          <Inbox className="h-14 w-14 opacity-20" />
          <p className="font-semibold text-base">All clear!</p>
          <p className="text-sm">No pending SMS transactions to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sms) => (
            <SmsReviewCard
              key={sms.id}
              sms={sms}
              accounts={accounts}
              categories={categories}
              onApprove={approveSmsTransaction}
              onReject={rejectSmsTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SmsReviewCard({
  sms,
  accounts,
  categories,
  onApprove,
  onReject,
}: {
  sms: SmsTransaction;
  accounts: any[];
  categories: any[];
  onApprove: (id: string, edits: Partial<SmsTransaction>) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [description, setDescription] = useState(sms.description);
  const [accountId, setAccountId] = useState<string>(sms.account_id ?? "");
  const [categoryId, setCategoryId] = useState<string>(sms.category_id ?? "");
  const [date, setDate] = useState(sms.date);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(sms.id, {
      description,
      account_id: accountId || null,
      category_id: categoryId || null,
      date,
    });
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(sms.id);
    setLoading(false);
  };

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        {/* Top bar */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-border/40",
          sms.type === "debit" ? "bg-red-500/5" : "bg-emerald-500/5"
        )}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-muted-foreground">{sms.sender}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                sms.type === "debit"
                  ? "border-red-500/30 text-red-400 bg-red-500/10"
                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              )}
            >
              {sms.type === "debit" ? "Debit" : "Credit"}
            </Badge>
          </div>
          <span className={cn(
            "text-lg font-bold tabular-nums",
            sms.type === "debit" ? "text-red-400" : "text-emerald-400"
          )}>
            {sms.type === "debit" ? "-" : "+"}₹{formatCurrency(sms.amount)}
          </span>
        </div>

        {/* Editable fields */}
        <div className="px-4 py-3 space-y-3">
          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
              placeholder="Transaction description"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No category</option>
                {categories
                  .filter((c) => c.type === (sms.type === "debit" ? "expense" : "income") || c.type === "both")
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Raw message toggle */}
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            {rawExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {rawExpanded ? "Hide" : "Show"} original SMS
          </button>

          {rawExpanded && (
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-muted-foreground font-mono leading-relaxed">
              {sms.raw_message}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-0 border-t border-border/40">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/5 transition-colors border-r border-border/40 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || !description}
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/5 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
