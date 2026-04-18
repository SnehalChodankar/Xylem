"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Plane, Pause, Play, MapPin, X } from "lucide-react";
import { EndTripDialog } from "@/components/travel/end-trip-dialog";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function TravelBanner() {
  const router = useRouter();
  const { activeTrip, pauseTrip, resumeTrip, getTripStats } = useAppStore();
  const [showEnd, setShowEnd] = useState(false);

  if (!activeTrip) return null;

  const stats = getTripStats(activeTrip.id);
  const budgetPct = activeTrip.budget ? (stats.total / activeTrip.budget) * 100 : 0;
  const overBudget = activeTrip.budget ? stats.total > activeTrip.budget : false;

  return (
    <>
      <div 
        onClick={() => router.push("/dashboard/travel")}
        className={`relative overflow-hidden cursor-pointer border-b transition-all ${
        activeTrip.is_paused
          ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30"
          : "bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/30"
      }`}>
        {/* Animated shimmer */}
        {!activeTrip.is_paused && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent animate-shimmer pointer-events-none" />
        )}

        <div className="flex items-center justify-between px-4 py-2 lg:px-6 gap-3">
          {/* Left: Trip info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activeTrip.is_paused ? "bg-amber-500/20" : "bg-sky-500/20"
            }`}>
              <Plane className={`h-4 w-4 ${activeTrip.is_paused ? "text-amber-500" : "text-sky-500"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{activeTrip.name}</p>
                {activeTrip.is_paused && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                    Paused
                  </span>
                )}
              </div>
              {activeTrip.destination && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-2.5 w-2.5" />
                  {activeTrip.destination}
                </p>
              )}
            </div>
          </div>

          {/* Center: Budget progress (if set) */}
          {activeTrip.budget && activeTrip.budget > 0 && (
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              <div className="w-32">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="font-semibold">{fmt(stats.total)}</span>
                  <span className="text-muted-foreground">of {fmt(activeTrip.budget)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overBudget ? "bg-destructive" : "bg-sky-500"}`}
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold tabular-nums ${overBudget ? "text-destructive" : "text-sky-500"}`}>
                {budgetPct.toFixed(0)}%
              </span>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                activeTrip.is_paused ? resumeTrip(activeTrip.id) : pauseTrip(activeTrip.id);
              }}
              className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium ${
                activeTrip.is_paused
                  ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              }`}
              title={activeTrip.is_paused ? "Resume trip" : "Pause trip"}
            >
              {activeTrip.is_paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span className="hidden sm:inline">{activeTrip.is_paused ? "Resume" : "Pause"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEnd(true);
              }}
              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs flex items-center gap-1 font-medium"
              title="End trip"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">End Trip</span>
            </button>
          </div>
        </div>
      </div>

      <EndTripDialog trip={showEnd ? activeTrip : null} onClose={() => setShowEnd(false)} />
    </>
  );
}
