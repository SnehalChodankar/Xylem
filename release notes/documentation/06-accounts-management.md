# Feature: Accounts & Reconciliation

## Overview
The Accounts section is where users manage their various financial stores (e.g., Bank Accounts, Credit Cards, Cash Wallets). Beyond simply listing accounts, it features a robust "Reconciliation" system to handle the inevitable drift between recorded Xylem transactions and the user's actual bank statements.

## Key Technical Highlights

### 1. Live Balance Calculation
The application calculates a "Net Worth (Live)" by reducing the global store's account balances and applying all transactions (credits and debits) associated with those accounts to compute the real-time `liveBalance`.

### 2. Automatic Reconciliation
Users can enter their exact current bank balance. The system computes the discrepancy between the Xylem ledger and the real bank balance. If a difference exists, hitting "Apply Adjusting Transaction" automatically injects a corrective ledger entry (either debit or credit) to sync the balances perfectly without requiring manual math.

### 3. Drift Tracking
The UI distinctly shows the opening baseline balance of an account versus its live calculated balance, indicating drift with directional arrows (e.g., `+₹5,000 from opening balance`).

## Key Code Structures

**File:** `src/app/dashboard/accounts/page.tsx`

```tsx
// Live Balance & Drift Calculation
const liveBalance = getLiveAccountBalance(acc.id);
const hasChanged = Math.abs(liveBalance - acc.balance) > 0.01;
const drift = liveBalance - acc.balance;

// Reconciliation Logic
const handleReconcile = async () => {
  if (!reconcileAccountId || realBalanceInput === "") return;
  setReconciling(true);
  
  // Triggers a store action that computes the difference
  // and injects an 'adjustment' transaction to balance the ledger.
  await reconcileAccount(reconcileAccountId, realBalanceNum);
  
  setReconciling(false);
  setReconcileDone(true);
};
```
