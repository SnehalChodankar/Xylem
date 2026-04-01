"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode } = useAppStore();

  // On first mount, apply dark (default) and mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync DOM class whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Prevent flash of unstyled content by hiding until mounted
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
