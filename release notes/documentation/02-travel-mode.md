# Feature: Travel Mode

## Overview
Travel Mode introduces the concept of "Trips" into the finance tracker. Instead of manually categorizing every vacation coffee or flight ticket, users can "Start a Trip". While active, this feature can contextualize expenses, keeping them grouped under a specific budget and destination, offering an isolated view of travel expenses without cluttering the primary dashboard.

## Key Technical Highlights

### 1. Dedicated Trip Context
The application maintains a global "active trip" state. By utilizing `useAppStore`, the app knows when to prompt or automatically link incoming transactions to the current active trip ID.

### 2. Streamlined Initialization
Users provide minimal but crucial data (Name, Destination, Budget, Start Date) to spin up a new trip ledger instantly.

## Key Code Structures

**File:** `src/components/travel/start-trip-dialog.tsx`

```tsx
// Creating a Trip via Zustand Store
const handleCreate = async () => {
  if (!name.trim()) return;
  setLoading(true);

  // createTrip action pushes the new trip object to the global store/database
  await createTrip({
    name: name.trim(),
    destination: destination.trim() || null,
    budget: budget ? parseFloat(budget) : null,
    start_date: startDate, // ISO date string
  });

  setLoading(false);
  onClose();
};
```
*Note: The store (`useAppStore`) orchestrates the connection to Supabase and manages local state reactivity, ensuring the UI immediately reflects the new active trip status across the application.*
