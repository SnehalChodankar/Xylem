"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ArrowLeftRight, Target, PieChart, Plus, MessageSquare, Sparkles, Settings, Plane } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { useAppStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const { smsTransactions, activeTrip } = useAppStore();
  const pendingCount = smsTransactions.filter((t) => t.status === "pending").length;

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/transactions", label: "Txns", icon: ArrowLeftRight },
    { href: "/dashboard/chat", label: "AI", icon: Sparkles },
    { href: "#add", label: "Add", icon: Plus, isAction: true },
    { href: "/dashboard/goals", label: "Goals", icon: Target },
    { href: "/dashboard/sms-review", label: "SMS", icon: MessageSquare, isSms: true },
    activeTrip 
      ? { href: "/dashboard/travel", label: "Travel", icon: Plane } 
      : { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl safe-area-bottom lg:hidden">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key="add"
                  onClick={() => setAddOpen(true)}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                    <Plus className="h-6 w-6" />
                  </div>
                </button>
              );
            }

            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            if (item.isSms) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors min-w-[45px] flex-1",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <MessageSquare className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white px-0.5 animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors min-w-[45px] flex-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
