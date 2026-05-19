# Feature: Local Native Notifications

## Overview
To improve user retention and ensure the ledger remains up-to-date, Xylem implements offline, native push notifications when running inside the Capacitor Android/iOS shell. These reminders prompt the user to manually log expenses and review auto-parsed SMS transactions at the end of the day.

## Key Technical Highlights

### 1. Capacitor Integration
The app uses `@capacitor/local-notifications`. Unlike server-side push notifications (which require FCM/APNS tokens, cloud infrastructure, and network connectivity), local notifications are scheduled directly on the device's OS calendar. They trigger even if the app is closed and the phone is offline.

### 2. Permissions Handling
Android 13+ requires explicit user permission to post notifications. The app seamlessly requests `LocalNotifications.requestPermissions()` on mount (within the main `layout.tsx`) before attempting to schedule the alarms.

### 3. Chronological Scheduling
The app establishes two daily anchors:
- **20:00 (8:00 PM)**: Reminds the user to manually categorize any loose cash expenses.
- **21:00 (9:00 PM)**: Reminds the user to sync their SMS inbox to ensure the AI parses any missed bank transactions.

## Key Code Structures

**File:** `src/app/dashboard/layout.tsx`

```tsx
import { LocalNotifications } from "@capacitor/local-notifications";

// Inside the primary layout useEffect hook
useEffect(() => {
  // 1. Guard against running on standard web browsers
  import("@capacitor/core").then(({ Capacitor }) => {
    if (Capacitor.isNativePlatform()) {
      
      // 2. Request Android 13+ Notification Permissions
      LocalNotifications.requestPermissions().then((result) => {
        if (result.display === 'granted') {
          
          // 3. Schedule the offline Cron Jobs
          LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: "Update your Ledger",
                body: "Did you spend anything today? Take a minute to categorize your expenses!",
                schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true },
                smallIcon: "ic_stat_name", 
              },
              {
                id: 2,
                title: "End of Day Review",
                body: "Don't forget to sync today's SMS to keep your tracker perfectly balanced.",
                schedule: { on: { hour: 21, minute: 0 }, allowWhileIdle: true },
                smallIcon: "ic_stat_name",
              }
            ]
          }).catch(console.error);
          
        }
      });
    }
  });
  // ... other initialization logic
}, []);
```
