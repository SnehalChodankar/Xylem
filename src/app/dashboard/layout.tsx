"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { DisclaimerDialog } from "@/components/layout/disclaimer-dialog";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, fetchData, seedDefaultCategories, isLoading, userId } = useAppStore();

  useEffect(() => {
    // Request Native Notification Permissions (required for Android 13+)
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().catch(console.error);
    }

    const supabase = createClient();

    const bootstrap = async () => {
      // STEP 1 (Native only): Restore the session from Capacitor Preferences FIRST.
      // This prevents the race condition where Android kills the WebView process and
      // wipes localStorage. We persist tokens natively and restore them on every open.
      if (Capacitor.isNativePlatform()) {
        try {
          const { Preferences } = await import("@capacitor/preferences");
          const { value: accessToken } = await Preferences.get({ key: "sb_access_token" });
          const { value: refreshToken } = await Preferences.get({ key: "sb_refresh_token" });

          if (accessToken && refreshToken) {
            // Rehydrate the supabase client with the stored tokens.
            // This is synchronous and instant — no network round-trip.
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        } catch (e) {
          console.warn("Could not restore session from Preferences:", e);
        }
      }

      // STEP 2: Use getSession() — reads from local storage instantly (no network).
      // NEVER use getUser() here. getUser() makes a live network call which causes
      // a race condition: userId is null for 500-800ms, triggering a redirect to /login.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user.id);
      }
    };

    bootstrap();

    // Listen for future auth state changes (e.g., token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user?.id ?? null);

      // Whenever the session updates on a native device, persist the new tokens
      if (Capacitor.isNativePlatform() && session) {
        try {
          const { Preferences } = await import("@capacitor/preferences");
          await Preferences.set({ key: "sb_access_token", value: session.access_token });
          await Preferences.set({ key: "sb_refresh_token", value: session.refresh_token });
        } catch (e) {
          console.warn("Could not persist session tokens:", e);
        }
      }

      // Clear tokens on sign out
      if (Capacitor.isNativePlatform() && !session) {
        try {
          const { Preferences } = await import("@capacitor/preferences");
          await Preferences.remove({ key: "sb_access_token" });
          await Preferences.remove({ key: "sb_refresh_token" });
        } catch (e) {
          console.warn("Could not clear session tokens:", e);
        }
      }
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
        (payload) => {
          const { smsTransactions } = useAppStore.getState();
          const newSms = payload.new as any;
          if (!smsTransactions.find((t) => t.id === newSms.id)) {
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
