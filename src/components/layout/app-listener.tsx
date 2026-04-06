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

        // Push the callback URL into Next.js router (exchanges code for session)
        router.push(slug);

        // After a short delay (to allow exchangeCodeForSession to complete),
        // grab the new session and persist it to native storage immediately.
        // This is the critical step that prevents session loss on next app open.
        setTimeout(async () => {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const { Preferences } = await import("@capacitor/preferences");
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              await Preferences.set({ key: "sb_access_token", value: session.access_token });
              await Preferences.set({ key: "sb_refresh_token", value: session.refresh_token });
            }
          } catch (e) {
            console.warn("Could not persist OAuth session tokens:", e);
          }
        }, 2000);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [router]);

  return null;
}
