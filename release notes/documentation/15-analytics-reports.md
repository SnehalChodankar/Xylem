# Feature: Analytics & Reports

## Overview
The Analytics section provides users with deep, dynamic insights into their financial behavior. It heavily utilizes `recharts` to render SVG-based charts, allowing users to visualize savings trends, categorical breakdowns, and top expenses over highly customizable timeframes (e.g., 1 Week, 1 Month, 3 Months, 6 Months, 1 Year).

## Key Technical Highlights

### 1. Dynamic Time Range Aggregation
The `trendData` calculation relies heavily on `useMemo` to prevent unnecessary recalculations. Depending on the `timeRange` state:
- **1W**: Calculates daily totals for the last 7 days from the `selectedMonth`.
- **1M**: Divides the month into 4 logical weeks and aggregates transactions per week.
- **3M / 6M / 12M**: Loops backwards through the calendar, automatically handling year boundaries (e.g., crossing from January back to December), to pull pre-calculated monthly stats from `getMonthlyStats`.

### 2. Multi-Dimensional Charts
- **Savings Trend**: An `AreaChart` that plots the net savings over the selected `timeRange`. It utilizes an SVG `<linearGradient>` to create a premium, faded fill effect below the stroke line.
- **Spending by Category**: Instead of a standard pie chart, it uses custom progressive HTML horizontal bars mapping to `item.category.color` to show the percentage of total expenses.
- **Payment Methods Pie**: A classic `PieChart` analyzing how money is moving (e.g., Cash, Credit Card, UPI).

### 3. Top Expenses List
Extracts the top 5 largest debit transactions of the current month and sorts them descending. This allows users to immediately spot large capital outflows.

## Key Code Structures

**File:** `src/app/dashboard/analytics/page.tsx`

```tsx
// Time Range Aggregation Logic (Example for '1W')
const trendData = useMemo(() => {
  const data = [];
  if (timeRange === "1W") {
    const endDate = new Date(selectedYear, selectedMonth, 0); 
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      
      const dayStr = d.toISOString().split("T")[0];
      const dayTxns = transactions.filter(t => t.date === dayStr);
      
      const income = dayTxns.filter(t => t.type === "credit").reduce((s,t) => s+t.amount, 0);
      const expenses = dayTxns.filter(t => t.type === "debit").reduce((s,t) => s+t.amount, 0);
      
      data.push({
        label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        income, expenses, savings: income - expenses,
      });
    }
  }
  // ... else if 1M, 3M, 6M, 12M logic ...
  return data;
}, [selectedMonth, selectedYear, timeRange, transactions]);

// Recharts AreaChart with Gradient
<AreaChart data={trendData}>
  <defs>
    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="savings" stroke="#6366f1" fill="url(#savingsGradient)" />
</AreaChart>
```
