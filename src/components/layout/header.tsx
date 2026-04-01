"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getMonthName } from "@/lib/helpers";

export function Header() {
  const { setSidebarOpen, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useAppStore();
  const now = new Date();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3 lg:px-6">
      {/* Left: Hamburger + Month Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-accent text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ‹
          </button>
          <span className="text-sm font-semibold min-w-[120px] text-center">
            {getMonthName(selectedMonth)} {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
