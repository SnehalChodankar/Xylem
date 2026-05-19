# Feature: Subscriptions & Bills

## Overview
This section manages "Recurring Transactions"—the automated engines that generate transactions on a schedule (e.g., Netflix subscription, monthly rent, daily coffee). Users can pause, resume, or delete these recurring schedules.

## Key Technical Highlights

### 1. Estimated Monthly Cost Normalization
Because subscriptions can be daily, weekly, monthly, or yearly, the system normalizes these varied frequencies into a single "Estimated Monthly Cost" KPI to give the user a clear understanding of their baseline monthly burn rate.

### 2. Pause/Resume Engines
Users can toggle the `is_active` state of a recurring transaction. When paused, the backend cron job (or client-side evaluation) will ignore this engine until it is resumed.

### 3. Frequency & Next Date Tracking
The UI clearly displays the frequency interval and calculates the exact `next_date` the transaction is scheduled to hit the ledger.

## Key Code Structures

**File:** `src/app/dashboard/subscriptions/page.tsx`

```tsx
// Monthly Cost Normalization Logic
const monthlyTotal = recurring_transactions
  .filter((r) => r.is_active && r.type === "debit")
  .reduce((sum, r) => {
    const multiplier =
      r.frequency === "daily" ? 30 :
      r.frequency === "weekly" ? 4.33 :
      r.frequency === "yearly" ? (1 / 12) : 1;
    return sum + (r.amount * multiplier);
  }, 0);

// Status Toggle Handler
const toggleStatus = async (id: string, currentStatus: boolean) => {
  setProcessingId(id);
  // Flips the active boolean in the database
  await updateRecurringTransaction(id, { is_active: !currentStatus });
  setProcessingId(null);
};
```
