"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { DisclaimerDialog } from "@/components/layout/disclaimer-dialog";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, fetchData, seedDefaultCategories, isLoading, userId } = useAppStore();

  useEffect(() => {
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

  // When userId becomes available, fetch all data and subscribe to realtime inserts
  useEffect(() => {
    if (!userId) return;

    fetchData().then(() => seedDefaultCategories());

    // Realtime: listen for new transactions inserted externally (e.g. SMS webhook)
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Append the new transaction to the store immediately
          const { transactions } = useAppStore.getState();
          const newTxn = payload.new as any;
          // Avoid duplicates if fetchData already loaded it
          if (!transactions.find((t) => t.id === newTxn.id)) {
            useAppStore.setState({
              transactions: [newTxn, ...transactions],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
