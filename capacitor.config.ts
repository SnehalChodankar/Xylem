import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xylem.tracking',
  appName: 'xylem-finance',
  webDir: 'out',
  server: {
    url: 'https://xylems.vercel.app',
    cleartext: true,
    allowNavigation: ["*.supabase.co", "*.google.com", "accounts.google.com"]
  }
};

export default config;
