# Feature: Settings & Profile

## Overview
The Settings page manages user preferences, account actions (Sign Out), data exports, and native mobile configurations. It heavily conditionally renders UI elements based on whether the user is accessing the app via a standard web browser or the native Android Capacitor shell.

## Key Technical Highlights

### 1. Context-Aware Native Features
Using `useEffect` and dynamic imports for `@capacitor/core`, the component detects if it's running in a native environment. If true, it unveils a hidden "Native Integration" panel allowing users to configure SMS tracking permissions and map specific bank SMS senders to Xylem accounts.

### 2. CSV Data Export
The application generates a `.csv` file entirely on the client side using JavaScript `Blob` and URL object creation, allowing users to securely download their financial data without requiring a backend generation process.

### 3. Dark Mode Toggle
Integrates with the global Zustand store (`toggleDarkMode`) to flip the application theme, instantly updating CSS variables across the entire application interface.

## Key Code Structures

**File:** `src/app/dashboard/settings/page.tsx`

```tsx
// Native Platform Detection & Plugin Verification
useEffect(() => {
  import("@capacitor/core").then(async ({ Capacitor, registerPlugin }) => {
    if (Capacitor.isNativePlatform()) {
      setIsNative(true); // Unhides native settings UI
      const SmsTracker = registerPlugin("SmsTracker");
      const perms = await SmsTracker.checkPermissions();
      // ... permission state evaluation
    }
  });
}, []);

// Client-Side CSV Export
const exportCSV = () => {
  const headers = ["Date", "Description", "Type", "Amount", "Category ID", "Payment Method", "Notes"];
  // ... map transactions to rows ...
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `fintrack-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```
