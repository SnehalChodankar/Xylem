"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const authCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Request Native Notification Permissions (required for Android 13+)
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().catch(console.error);
    }

    const supabase = createClient();
    let resolved = false;

    const bootstrap = async () => {
      // getSession() reads from the cookie/localStorage — no network call needed.
      // This resolves IMMEDIATELY even with no internet connection.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        resolved = true;
        setUser(session.user.id);
        return;
      }

      // No session found yet. On native, the network may not be ready immediately
      // after the app wakes. Wait up to 5 seconds before redirecting to login.
      if (Capacitor.isNativePlatform()) {
        authCheckTimer.current = setTimeout(() => {
          if (!resolved) {
            // Still no session after 5 seconds — genuinely unauthenticated.
            router.push("/");
          }
        }, 5000);
      } else {
        // On web, redirect immediately.
        router.push("/");
      }
    };

    bootstrap();

    // Listen for auth state changes.
    // onAuthStateChange fires when a session is established (e.g., token refresh completes).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolved = true;
        // Clear the fallback redirect timer — user IS authenticated.
        if (authCheckTimer.current) clearTimeout(authCheckTimer.current);
        setUser(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (authCheckTimer.current) clearTimeout(authCheckTimer.current);
    };
  }, [setUser, router]);

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
