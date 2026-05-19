# Feature: Native SMS Transaction Review

## Overview
This feature bridges the gap between the mobile OS and the web application. When deployed natively on Android via Capacitor, the application utilizes a custom Java plugin (`SmsTracker`) to scan the user's device inbox for bank transaction SMS messages. These messages are sent to an AI webhook for parsing and are then placed in a "Review Queue".

## Key Technical Highlights

### 1. Capacitor Native Plugin
The client checks if it is running on a native platform using `Capacitor.isNativePlatform()`. If true, it invokes the custom native plugin to request SMS reading permissions and fetch the day's messages.

### 2. Server-Side AI Parsing
The raw SMS array is sent to `/api/webhooks/sms`, where a server-side AI model extracts the bank name, amount, type (credit/debit), and date, inserting them into a `pending` queue in Supabase.

### 3. Human-in-the-Loop Review
Because AI extraction can occasionally be imperfect, parsed SMS transactions are held in a "Pending" state. The user must manually review them in the `SmsReviewCard`, assign an Account and Category, and click "Approve" (which moves it to the main ledger) or "Reject" (which discards it).

## Key Code Structures

**File:** `src/app/dashboard/sms-review/page.tsx`

```tsx
import { Capacitor, registerPlugin } from "@capacitor/core";
// Registering the custom Java plugin
const SmsTracker = registerPlugin<any>("SmsTracker");

const handleSync = async () => {
  // 1. Guard for native platform
  if (!Capacitor.isNativePlatform()) {
    setSyncMessage({ type: 'error', text: "Only available on Android." });
    return;
  }

  // 2. Invoke native Java code
  const result = await SmsTracker.syncTodaySms();
  const messages = result.messages || [];

  // 3. Send to API for AI Parsing
  const res = await fetch("/api/webhooks/sms", {
    method: "POST",
    body: JSON.stringify({ messages })
  });

  // 4. Refresh Zustand store to show newly pending items
  await fetchData();
};
```
