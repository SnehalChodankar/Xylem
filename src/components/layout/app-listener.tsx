"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function AppDeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("appUrlOpen", async (event) => {
      // Example url: https://xylems.vercel.app/auth/callback?code=XYZ...
      const url = event.url;
      const slug = url.includes("xylems.vercel.app")
        ? url.split("xylems.vercel.app").pop()
        : url.split("com.xylem.tracking:/").pop();

      if (slug) {
        // Close the Chrome Custom Tab overlay
        import("@capacitor/browser").then(({ Browser }) => {
          Browser.close().catch(console.error);
        });

        // Push the callback URL into Next.js router.
        // The /auth/callback route handler calls exchangeCodeForSession() on the
        // server, which sets the Supabase auth cookie in the WebView's cookie jar.
        // That cookie is natively persistent across app restarts — no extra
        // token storage is needed.
        router.push(slug);
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [router]);

  return null;
}
