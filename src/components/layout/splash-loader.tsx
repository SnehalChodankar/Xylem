"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SplashLoader({ fullScreen = true }: { fullScreen?: boolean }) {
  const [show, setShow] = useState(false);

  // Slight delay to prevent flashing on extremely fast loads
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background",
      fullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full w-full py-20"
    )}>
      {/* Decorative ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 z-10 animate-fade-in">
        {/* Pulsing Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <img
            src="/logo.png"
            alt="Xylem Finance"
            className="w-16 h-16 relative z-10 animate-bounce drop-shadow-2xl rounded-2xl"
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Text Loader */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 bg-clip-text animate-shimmer" style={{ backgroundSize: '200% auto' }}>
            Xylem Finance
          </h2>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>Syncing your ledger...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
