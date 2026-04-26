"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { DisclaimerDialog } from "@/components/layout/disclaimer-dialog";
import { TravelBanner } from "@/components/travel/travel-banner";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, fetchData, seedDefaultCategories, isLoading, userId } = useAppStore();

  useEffect(() => {
    // Request Native Notification Permissions (required for Android 13+) and schedule daily reminders
    import("@capacitor/core").then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.requestPermissions().then((result) => {
          if (result.display === 'granted') {
            LocalNotifications.schedule({
              notifications: [
                {
                  title: "Update your Ledger",
                  body: "Did you spend anything today? Take a minute to categorize your expenses!",
                  id: 1,
                  schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true },
                  smallIcon: "ic_stat_name", // Optional: uses default app icon if not specified
                },
                {
                  title: "End of Day Review",
                  body: "Don't forget to sync today's SMS to keep your tracker perfectly balanced.",
                  id: 2,
                  schedule: { on: { hour: 21, minute: 0 }, allowWhileIdle: true },
                  smallIcon: "ic_stat_name",
                }
              ]
            }).catch(console.error);
          }
        }).catch(console.error);
      }
    });

    const supabase = createClient();

    // Bootstrap: get the session, set userId, load data, and seed categories if needed
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user.id);
      }
    });

    // Listen for auth state changes (e.g., token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (!userId) return;

    fetchData().then(() => seedDefaultCategories());

    const supabase = createClient();

    // Realtime: new transactions inserted externally (SMS webhook → approval)
    const txChannel = supabase
      .channel("realtime-transactions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        (payload) => {
          const { transactions } = useAppStore.getState();
          const newTxn = payload.new as any;
          if (!transactions.find((t) => t.id === newTxn.id)) {
            useAppStore.setState({ transactions: [newTxn, ...transactions] });
          }
        }
      ).subscribe();

    // Realtime: new SMS staging rows — updates the pending badge instantly
    const smsChannel = supabase
      .channel("realtime-sms-transactions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sms_transactions", filter: `user_id=eq.${userId}` },
        async (payload) => {
          const { smsTransactions } = useAppStore.getState();
          const newSms = payload.new as any;
          if (!smsTransactions.find((t) => t.id === newSms.id)) {
            try {
              const res = await fetch("/api/sms/decrypt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ encryptedData: newSms.raw_message })
              });
              const { decrypted } = await res.json();
              newSms.raw_message = decrypted || newSms.raw_message;
            } catch (err) {
              console.error("Failed to decrypt incoming realtime SMS:", err);
            }
            useAppStore.setState({ smsTransactions: [newSms, ...smsTransactions] });
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(smsChannel);
    };
  }, [userId, fetchData, seedDefaultCategories]);

  if (isLoading && !userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading your finances…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-sm">
      <DisclaimerDialog />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <TravelBanner />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            children
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
