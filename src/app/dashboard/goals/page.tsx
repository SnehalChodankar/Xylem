"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import { AddGoalDialog } from "@/components/dashboard/add-goal-dialog";
import { ContributeGoalDialog } from "@/components/dashboard/contribute-goal-dialog";
import { RedeemGoalDialog } from "@/components/dashboard/redeem-goal-dialog";
import { Button } from "@/components/ui/button";
import {
  Plus, Target, Trash2, CheckCircle2, CalendarClock, TrendingUp, Wallet,
  PartyPopper, Banknote, RotateCcw,
} from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function GoalsPage() {
  const { goals, accounts, deleteGoal, getAccountGoalStats, getLiveAccountBalance, withdrawFromGoal } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [redeemGoal, setRedeemGoal] = useState<Goal | null>(null);

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  // Sort: target-reached goals first, then by progress descending
  const sortedActiveGoals = [...activeGoals].sort((a, b) => {
    const aReached = a.current_amount >= a.target_amount ? 1 : 0;
    const bReached = b.current_amount >= b.target_amount ? 1 : 0;
    if (aReached !== bReached) return bReached - aReached; // reached first
    const aPct = a.target_amount > 0 ? a.current_amount / a.target_amount : 0;
    const bPct = b.target_amount > 0 ? b.current_amount / b.target_amount : 0;
    return bPct - aPct; // then highest progress
  });

  return (
    <div className="p-4 lg:p-6 space-y-8 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your savings targets and plan ahead
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="rounded-xl gap-2 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* ── Active Goals Grid ─────────────────────────────────────────── */}
      {sortedActiveGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first savings goal to get started
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="rounded-xl mt-2">
            Create Goal
          </Button>
        </div>
      ) : sortedActiveGoals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedActiveGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={() => setContributeGoal(goal)}
              onRedeem={() => setRedeemGoal(goal)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      ) : null}

      {/* ── Account Savings Panel ─────────────────────────────────────── */}
      {accounts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Account Savings Breakdown
            </h2>
          </div>

          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-4 px-4 py-2.5 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Account</span>
              <span className="text-right">Live Balance</span>
              <span className="text-right">Allocated</span>
              <span className="text-right">Free Savings</span>
            </div>

            {/* Data rows */}
            {accounts.map((account, i) => {
              const liveBalance = getLiveAccountBalance(account.id);
              const { allocated, free } = getAccountGoalStats(account.id);
              const allocatedPct = liveBalance > 0 ? (allocated / liveBalance) * 100 : 0;

              return (
                <div
                  key={account.id}
                  className={`grid grid-cols-4 items-center px-4 py-3.5 gap-2 ${
                    i !== accounts.length - 1 ? "border-b border-border/30" : ""
                  }`}
                >
                  {/* Account name + icon */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: account.color || "#6366f1" }}
                    >
                      {account.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-sm truncate">{account.name}</span>
                  </div>

                  {/* Live balance */}
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {fmt(liveBalance)}
                  </span>

                  {/* Allocated */}
                  <div className="text-right space-y-1">
                    <span className={`text-sm font-semibold tabular-nums ${allocated > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {fmt(allocated)}
                    </span>
                    {allocated > 0 && (
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/70"
                          style={{ width: `${Math.min(allocatedPct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Free savings */}
                  <span className={`text-right text-sm font-bold tabular-nums ${free > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {fmt(free)}
                  </span>
                </div>
              );
            })}

            {/* Summary totals */}
            <div className="grid grid-cols-4 px-4 py-3 bg-muted/20 border-t border-border/50 text-sm font-bold">
              <span className="text-muted-foreground">Total</span>
              <span className="text-right tabular-nums">
                {fmt(accounts.reduce((s, a) => s + getLiveAccountBalance(a.id), 0))}
              </span>
              <span className="text-right tabular-nums text-amber-500">
                {fmt(accounts.reduce((s, a) => s + getAccountGoalStats(a.id).allocated, 0))}
              </span>
              <span className="text-right tabular-nums text-emerald-500">
                {fmt(accounts.reduce((s, a) => s + getAccountGoalStats(a.id).free, 0))}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground px-1">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            <strong>Allocated</strong> = funds reserved for active goals.{" "}
            <strong>Free Savings</strong> = balance not yet committed to any goal.
          </p>
        </section>
      )}

      {/* ── Completed Goals ───────────────────────────────────────────── */}
      {completedGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Completed Goals ({completedGoals.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="relative flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-muted/20 group"
              >
                <span className="text-2xl">{goal.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{goal.name}</p>
                  <p className="text-xs text-emerald-500 font-medium">
                    {fmt(goal.target_amount)} · Redeemed 🎉
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setContributeGoal(goal)}
                    title="Manage funds (withdraw to reactivate)"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            💡 Hover on a completed goal and click <RotateCcw className="inline h-3 w-3" /> to withdraw funds — this will reactivate the goal.
          </p>
        </section>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────── */}
      <AddGoalDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ContributeGoalDialog goal={contributeGoal} onClose={() => setContributeGoal(null)} />
      <RedeemGoalDialog goal={redeemGoal} onClose={() => setRedeemGoal(null)} />
    </div>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onContribute,
  onRedeem,
  onDelete,
}: {
  goal: Goal;
  onContribute: () => void;
  onRedeem: () => void;
  onDelete: () => void;
}) {
  const progressPct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = goal.target_amount - goal.current_amount;
  const isOverdue = goal.deadline && isPast(parseISO(goal.deadline));
  const isTargetReached = goal.current_amount >= goal.target_amount;
  const { accounts } = useAppStore();
  const linkedAccount = accounts.find((a) => a.id === goal.account_id);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-card p-5 gap-4 hover:shadow-lg transition-all duration-200 overflow-hidden ${
        isTargetReached
          ? "border-emerald-500/50 shadow-md shadow-emerald-500/10"
          : "border-border/40"
      }`}
      style={{ borderColor: isTargetReached ? undefined : goal.color + "30" }}
    >
      {/* Subtle tinted bg */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${goal.color}, transparent 70%)` }}
      />

      {/* Target Reached Banner */}
      {isTargetReached && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl flex items-center gap-1">
          <PartyPopper className="h-3 w-3" />
          Target Reached!
        </div>
      )}

      {/* Top row: icon + name + delete */}
      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: goal.color + "25" }}
          >
            {goal.icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{goal.name}</p>
            {linkedAccount && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {linkedAccount.name}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Amounts */}
      <div className="relative space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <p
              className="text-xl font-bold tabular-nums"
              style={{ color: goal.color }}
            >
              {fmt(goal.current_amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              of {fmt(goal.target_amount)}
            </p>
          </div>
          <span className={`text-sm font-bold tabular-nums ${isTargetReached ? "text-emerald-500" : "text-muted-foreground"}`}>
            {progressPct.toFixed(0)}%
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isTargetReached ? "animate-pulse" : ""}`}
            style={{
              width: `${progressPct}%`,
              background: isTargetReached
                ? "linear-gradient(90deg, #22c55e, #10b981)"
                : `linear-gradient(90deg, ${goal.color}99, ${goal.color})`,
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {isTargetReached
            ? "🎉 Your savings target has been reached!"
            : `${fmt(remaining)} to go`}
        </p>
      </div>

      {/* Deadline badge */}
      {goal.deadline && !isTargetReached && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full self-start ${
            isOverdue
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <CalendarClock className="h-3 w-3" />
          {isOverdue ? "Overdue · " : ""}
          {formatDistanceToNow(parseISO(goal.deadline), { addSuffix: true })}
        </div>
      )}

      {/* CTA — changes based on state */}
      {isTargetReached ? (
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={onContribute}
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl text-xs"
          >
            Manage
          </Button>
          <Button
            onClick={onRedeem}
            size="sm"
            className="flex-1 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Banknote className="h-3.5 w-3.5 mr-1.5" />
            Withdraw Funds
          </Button>
        </div>
      ) : (
        <Button
          onClick={onContribute}
          size="sm"
          className="w-full rounded-xl font-semibold text-white mt-auto"
          style={{ backgroundColor: goal.color }}
        >
          Add Funds
        </Button>
      )}
    </div>
  );
}

