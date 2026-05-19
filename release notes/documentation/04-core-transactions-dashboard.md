# Feature: Dashboard & Core Transactions

## Overview
The heart of the Xylem Finance Tracker is its dashboard and transaction management system. It aggregates user financial data to provide instant insights into budgets, spending habits, and recent activities.

## Key Technical Highlights

### 1. Interactive Data Visualization
The dashboard extensively utilizes the `recharts` library to render responsive SVG charts. Components like `spending-chart.tsx` and `income-expense-chart.tsx` parse raw transaction lists from the Zustand store into aggregated datasets for visual plotting.

### 2. Global State via Zustand
The `useAppStore` acts as the single source of truth for the application frontend. It fetches and synchronizes transactions, accounts, categories, and goals from Supabase, allowing any component (like a chart or a list) to re-render optimally when a new transaction is added.

### 3. Dialog-Driven Architecture
Adding, editing, and managing transactions happens via non-blocking Modal Dialogs (using `shadcn/ui` dialogs). This keeps the user within the context of their dashboard without requiring heavy page loads.

## Key Code Structures

**Architectural Flow:**
1. **Store Initialization:** `lib/store.ts` configures Zustand slices for transactions and accounts.
2. **Chart Data Prep:** Dashboard components derive data via hooks.
3. **UI Rendering:** Shadcn UI combined with Recharts handles the display.

*Example generic chart setup (conceptual based on `recharts` usage in `src/components/dashboard`):*

```tsx
import { useAppStore } from "@/lib/store";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function SpendingChart() {
  // Pulling global state
  const { transactions, categories } = useAppStore();
  
  // ... data aggregation logic mapping transactions to categories ...
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={aggregatedData} dataKey="value" nameKey="name">
          {aggregatedData.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```
