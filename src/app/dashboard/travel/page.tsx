"use client";

import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plane, Plus, MapPin, Play, Pause, X, Upload, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartTripDialog } from "@/components/travel/start-trip-dialog";
import { EndTripDialog } from "@/components/travel/end-trip-dialog";
import { Trip } from "@/lib/types";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function TravelPage() {
  const { trips, activeTrip, getTripStats, pauseTrip, resumeTrip, deleteTrip } = useAppStore();
  const [showStart, setShowStart] = useState(false);
  const [tripToEnd, setTripToEnd] = useState<Trip | null>(null);

  const pastTrips = trips.filter((t) => !t.is_active);

  return (
    <div className="p-4 lg:p-6 space-y-8 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Travel Mode</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your trips separately from your main finances.
          </p>
        </div>
      </div>

      {/* ── Active Trip ─────────────────────────────────────────────── */}
      {activeTrip ? (
        <section className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {!activeTrip.is_paused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeTrip.is_paused ? "bg-amber-500" : "bg-sky-500"}`}></span>
            </span>
            Active Trip
          </h2>

          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-6 ${
              activeTrip.is_paused
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-sky-500/5 border-sky-500/20 shadow-lg shadow-sky-500/5"
            }`}
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">{activeTrip.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {activeTrip.destination && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {activeTrip.destination}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(activeTrip.start_date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeTrip.is_paused ? resumeTrip(activeTrip.id) : pauseTrip(activeTrip.id)}
                  className={`rounded-xl ${activeTrip.is_paused ? "text-emerald-500 hover:text-emerald-600" : "text-amber-500 hover:text-amber-600"}`}
                >
                  {activeTrip.is_paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {activeTrip.is_paused ? "Resume" : "Pause Tracking"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setTripToEnd(activeTrip)}
                  className="rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  End Trip
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Spent" value={fmt(getTripStats(activeTrip.id).total)} />
              <StatCard title="Transactions" value={getTripStats(activeTrip.id).count.toString()} />
              <StatCard title="Daily Average" value={fmt(getTripStats(activeTrip.id).daily)} />
              {activeTrip.budget ? (
                <StatCard
                  title="Remaining Budget"
                  value={fmt(Math.max(0, activeTrip.budget - getTripStats(activeTrip.id).total))}
                  isCritical={getTripStats(activeTrip.id).total > activeTrip.budget}
                />
              ) : (
                <div />
              )}
            </div>

            {/* Breakdowns */}
            {getTripStats(activeTrip.id).byCategory.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Top Categories
                </h4>
                <div className="space-y-3">
                  {getTripStats(activeTrip.id).byCategory.map((cat, i) => {
                    const pct = (cat.amount / getTripStats(activeTrip.id).total) * 100;
                    return (
                      <div key={cat.name} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-medium text-sm truncate">{cat.name}</span>
                        </div>
                        <div className="w-[40%] flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full border border-border/50 bg-background overflow-hidden relative">
                            <div
                              className="absolute top-0 left-0 bottom-0 rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-sm font-semibold tabular-nums w-16 text-right">
                            {fmt(cat.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center p-10 py-20 rounded-2xl border border-dashed text-center">
          <div className="h-16 w-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-4 text-sky-500">
            <Plane className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold mb-1">No Active Trip</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Start Travel Mode to sandbox your travel expenses. They won't mess up your main budgets until you want them to.
          </p>
          <Button onClick={() => setShowStart(true)} className="rounded-xl font-semibold bg-sky-600 hover:bg-sky-700 text-white">
            <Plane className="h-4 w-4 mr-2" /> Start Travel Mode
          </Button>
        </section>
      )}

      {/* ── Past Trips ──────────────────────────────────────────────── */}
      {pastTrips.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Trip History ({pastTrips.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastTrips.map((trip) => {
              const stats = getTripStats(trip.id);
              return (
                <div key={trip.id} className="rounded-2xl border bg-card p-5 space-y-4 relative group">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center font-bold text-muted-foreground flex-shrink-0">
                      {trip.destination ? trip.destination[0].toUpperCase() : "✈️"}
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <p className="font-bold text-sm truncate leading-tight">{trip.name}</p>
                      <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        {format(parseISO(trip.start_date), "MMM yyyy")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end border-t pt-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Total Spent</p>
                      <p className="text-lg font-bold">{fmt(stats.total)}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Duration</p>
                      <p className="text-sm font-semibold">
                        {trip.end_date
                          ? Math.max(1, Math.ceil((parseISO(trip.end_date).getTime() - parseISO(trip.start_date).getTime()) / 86400000))
                          : 1}{" "}
                        Days
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Dialogs */}
      <StartTripDialog open={showStart} onClose={() => setShowStart(false)} />
      <EndTripDialog trip={tripToEnd} onClose={() => setTripToEnd(null)} />
    </div>
  );
}

function StatCard({ title, value, isCritical }: { title: string; value: string; isCritical?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${isCritical ? "bg-destructive/5 border-destructive/20 text-destructive" : "bg-card"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
