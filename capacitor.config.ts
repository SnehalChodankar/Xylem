import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xylem.tracking',
  appName: 'xylem-finance',
  webDir: 'out',
  server: {
    url: 'https://xylems.vercel.app',
    cleartext: true,
    allowNavigation: ["*.supabase.co", "*.google.com", "accounts.google.com"]
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "258162601863-bgaf9t7jms91no525r7n7ub6gmi0imr9.apps.googleusercontent.com"
    }
  }
};

export default config;
