"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Trip } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Upload, XCircle } from "lucide-react";

interface EndTripDialogProps {
  trip: Trip | null;
  onClose: () => void;
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function EndTripDialog({ trip, onClose }: EndTripDialogProps) {
  const { endTrip, logTripToLedger, getTripStats } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<"log" | "skip" | null>(null);

  if (!trip) return null;

  const stats = getTripStats(trip.id);

  const handleEnd = async (logToLedger: boolean) => {
    setChoice(logToLedger ? "log" : "skip");
    setLoading(true);

    if (logToLedger) {
      await logTripToLedger(trip.id);
    }
    await endTrip(trip.id);

    setLoading(false);
    setChoice(null);
    onClose();
  };

  const days = Math.max(
    1,
    Math.ceil(
      (new Date().getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <Dialog open={!!trip} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            End Trip — {trip.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Trip summary */}
          <div className="rounded-xl bg-sky-500/10 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <span className="text-xl font-bold text-sky-500">{fmt(stats.total)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background/50 rounded-lg p-2">
                <p className="text-lg font-bold">{stats.count}</p>
                <p className="text-[10px] text-muted-foreground">Transactions</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2">
                <p className="text-lg font-bold">{days}</p>
                <p className="text-[10px] text-muted-foreground">Days</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2">
                <p className="text-lg font-bold">{fmt(stats.daily)}</p>
                <p className="text-[10px] text-muted-foreground">Avg / Day</p>
              </div>
            </div>

            {trip.budget && trip.budget > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Budget</span>
                  <span className={stats.total > trip.budget ? "text-destructive font-semibold" : "text-emerald-500 font-semibold"}>
                    {fmt(stats.total)} / {fmt(trip.budget)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.total > trip.budget ? "bg-destructive" : "bg-sky-500"}`}
                    style={{ width: `${Math.min((stats.total / trip.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Top categories */}
            {stats.byCategory.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Categories</p>
                {stats.byCategory.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span className="text-xs">{cat.name}</span>
                    </span>
                    <span className="font-semibold text-xs tabular-nums">{fmt(cat.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action: Log to ledger or skip */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              What would you like to do with these {stats.count} trip transactions?
            </p>

            <Button
              onClick={() => handleEnd(true)}
              disabled={loading}
              className="w-full rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white justify-start gap-3 h-12"
            >
              {loading && choice === "log" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold">Log to Main Ledger</p>
                <p className="text-[10px] opacity-80">Transactions will appear in your dashboard &amp; affect account balances</p>
              </div>
            </Button>

            <Button
              onClick={() => handleEnd(false)}
              disabled={loading}
              variant="outline"
              className="w-full rounded-xl font-semibold justify-start gap-3 h-12"
            >
              {loading && choice === "skip" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold">Keep Trip-Only</p>
                <p className="text-[10px] text-muted-foreground">Transactions stay in trip history but won't affect your main finances</p>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
