# Feature: Transactions List

## Overview
The Transactions page acts as the comprehensive ledger for the user. It aggregates all transactions for the currently selected month and provides powerful searching, filtering, and bulk-action capabilities.

## Key Technical Highlights

### 1. Advanced Client-Side Filtering
The `useMemo` hook is heavily utilized to compute the `filteredTransactions`. It instantly evaluates search string queries against transaction descriptions, notes, and category names, while simultaneously applying debit/credit filters and specific category filters—all on the client side for zero-latency feedback.

### 2. Grouping by Date
Instead of a flat table, transactions are visually grouped by their chronological date. The code iterates through the filtered list, constructs a dictionary keyed by date, and renders isolated cards for each day.

### 3. Bulk Actions
A `Set` is used to track `selectedIds`. When multiple items are selected, a sticky action bar appears allowing the user to bulk delete transactions in a single action.

## Key Code Structures

**File:** `src/app/dashboard/transactions/page.tsx`

```tsx
// Advanced Multi-Filter Logic
const filteredTransactions = useMemo(() => {
  return allTransactions.filter((t) => {
    // Type Filter
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    // Category Filter
    if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
    
    // Search String Filter
    if (search) {
      const q = search.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        categories.find((c) => c.id === t.category_id)?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });
}, [allTransactions, typeFilter, categoryFilter, search, categories]);

// Grouping by Date
const grouped = useMemo(() => {
  const groups: { [date: string]: typeof filteredTransactions } = {};
  filteredTransactions.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });
  // Sort descending by date
  return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
}, [filteredTransactions]);
```
