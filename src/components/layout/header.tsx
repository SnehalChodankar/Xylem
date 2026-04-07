"use client";

import { useState } from "react";
import { Menu, Bell, CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAppStore } from "@/lib/store";
import { getMonthName } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export function Header() {
  const { 
    setSidebarOpen, 
    selectedMonth, 
    selectedYear, 
    setSelectedMonth, 
    setSelectedYear,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useAppStore();
  const now = new Date();
  
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

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
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[380px] max-w-[calc(100vw-32px)] mx-4 sm:mx-0 p-0 overflow-hidden rounded-xl shadow-xl border-border/60">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card/60 backdrop-blur-sm">
              <span className="font-bold tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs font-semibold text-primary"
                  onClick={() => markAllNotificationsAsRead()}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground text-center px-4">
                  <Bell className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">You're all caught up!</p>
                  <p className="text-xs mt-1">No new notifications in your inbox.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {notifications.map((notif) => {
                    const content = (
                      <div 
                        className={cn(
                          "flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/50 cursor-pointer relative",
                          !notif.is_read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notif.is_read) markNotificationAsRead(notif.id);
                        }}
                      >
                        <div className="mt-0.5 shrink-0 bg-background p-1 rounded-full shadow-sm">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={cn("text-sm font-bold leading-none", !notif.is_read && "text-foreground")}>{notif.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{notif.message}</p>
                          <p className="text-[10px] font-medium text-muted-foreground pt-1">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    );

                    return notif.action_url ? (
                      <Link 
                        key={notif.id} 
                        href={notif.action_url} 
                        className="block"
                        onClick={() => setPopoverOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={notif.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
