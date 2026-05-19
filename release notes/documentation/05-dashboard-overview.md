# Feature: Dashboard Overview

## Overview
The main Dashboard serves as the central hub of the Xylem Finance Tracker. It provides a highly visual, at-a-glance summary of the user's financial health for a specific month and year, combining key performance indicators (KPIs), dynamic charts, and quick-access widgets.

## Key Technical Highlights

### 1. Unified State Management
The dashboard deeply integrates with `useAppStore` (Zustand) to pull pre-calculated statistics such as total income, total expenses, net savings, and savings rate (`getMonthlyStats`). Because state is centralized, any transaction added via the "Add Transaction" dialog instantly causes the dashboard's KPI cards and charts to re-render with the latest data.

### 2. Staggered Animations
The KPIs utilize `tailwind-animate` and custom CSS classes (`stagger-1`, `stagger-2`, etc.) combined with `animate-fade-in` to create a smooth, staggered loading effect when the user lands on the page, significantly enhancing the perceived premium feel of the app.

### 3. Component Modularity
Rather than a monolithic file, the dashboard is composed of distinct widgets:
- `SpendingChart`: A pie chart breaking down expenses by category.
- `IncomeExpenseChart`: A bar chart comparing cash flow.
- `BudgetOverview`: A mini-view of current budget progress.
- `RecentTransactions`: A lightweight list of the 5 most recent activities.

## Key Code Structures

**File:** `src/app/dashboard/page.tsx`

```tsx
// Fetching pre-calculated stats from Zustand
const { selectedMonth, selectedYear, getMonthlyStats } = useAppStore();
const stats = getMonthlyStats(selectedMonth, selectedYear);

// KPI Card Data Structure mapping values to colors and icons
const statCards = [
  { title: "Income", value: stats.totalIncome, icon: TrendingUp, color: "text-emerald-500", ... },
  { title: "Expenses", value: stats.totalExpenses, icon: TrendingDown, color: "text-red-500", ... },
  { title: "Net Savings", value: stats.netSavings, icon: PiggyBank, ... },
  { title: "Savings Rate", value: stats.savingsRate, icon: Percent, isPercent: true, ... },
];
```
