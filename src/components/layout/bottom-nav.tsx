"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ArrowLeftRight, Target, PieChart, Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "#add", label: "Add", icon: Plus, isAction: true },
  { href: "/dashboard/budgets", label: "Budgets", icon: Target },
  { href: "/dashboard/analytics", label: "Analytics", icon: PieChart },
];

export function BottomNav() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
