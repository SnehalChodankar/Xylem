# Feature: Budgets Tracking

## Overview
The Budgets feature allows users to set strict monthly limits on specific expense categories. It provides visual feedback through progress bars, warning colors, and percentage counters to ensure users know exactly how close they are to overspending.

## Key Technical Highlights

### 1. Dynamic Progress Bars
The UI uses a color-coded progress bar system (`shadcn/ui` style elements) that dynamically shifts from Emerald (safe) to Amber (warning, >80%) to Red (over budget, >100%).

### 2. Month/Year Filtering
Budgets are inherently tied to the `selectedMonth` and `selectedYear` in the global state. This allows users to have different budgets for different months (e.g., a higher "Gifts" budget in December) without overwriting past data.

### 3. Smart Category Selection
When adding a new budget, the UI filters out categories that already have an active budget for the current month, preventing duplicate entries and confusion.

## Key Code Structures

**File:** `src/app/dashboard/budgets/page.tsx`

```tsx
// Extracting active budgets and mapping progress
const progress = getBudgetProgress(selectedMonth, selectedYear);

// Smart Category Filtering
const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
const budgetedCategoryIds = budgets
  .filter((b) => b.month === selectedMonth && b.year === selectedYear)
  .map((b) => b.category_id);
const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.includes(c.id));

// Progress Bar Styling Logic
const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
const isOver = budget.spent > budget.amount;
const isWarning = percent >= 80 && !isOver;

// Dynamic CSS classes applied based on state
className={cn(
  "h-full rounded-full transition-all duration-500",
  isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
)}
```
