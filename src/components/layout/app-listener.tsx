"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function AppDeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("appUrlOpen", (event) => {
      // Example url: com.xylem.tracking://auth/callback?code=XYZ...
      const url = event.url;
      const slug = url.split("com.xylem.tracking:/").pop();
      
      if (slug) {
        // We push the URL into the Next.js router. The route handler handles the session.
        import("@capacitor/browser").then(({ Browser }) => {
          Browser.close().catch(console.error);
        });
        
        router.push(slug);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [router]);

  return null;
}
