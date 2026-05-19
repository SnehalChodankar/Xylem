# Xylem Finance Tracker

Xylem Finance Tracker is a comprehensive, modern web and mobile application designed to simplify personal finance management, track travel expenses, and automate data entry through AI-powered receipt scanning.

## 🚀 Key Features

- **AI-Powered Receipt OCR:** Snap a picture of your bill and let Gemini AI automatically extract the amount, description, and categorize the expense.
- **Travel Mode:** Start a "Trip" to keep vacation or business travel expenses grouped together without muddying your main financial ledger.
- **Goals Management:** Set personalized, visually customized financial goals linked to your accounts to track your savings progress over time.
- **Rich Dashboard & Analytics:** Visualize your income, expenses, and overall budget via interactive charts.
- **Cross-Platform:** Built as a responsive web app with mobile-first capabilities via Capacitor for native Android deployment.

## 🛠️ Technology Stack

The application is built using a modern, scalable stack:

### Frontend
- **Framework:** [Next.js 16.2](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (`useAppStore`)
- **Forms & Validation:** `react-hook-form` & `zod`
- **Charts:** [Recharts](https://recharts.org/)

### Backend & Database
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Supabase SSR Auth)
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/docs) (`@ai-sdk/google`) powered by Gemini Vision.

### Mobile Integration
- **Hybrid Mobile:** [Capacitor 8](https://capacitorjs.com/) (`@capacitor/android`, `@capacitor/core`) for native feature access like camera and local notifications.

## 📁 Documentation

Detailed documentation for each of the core features can be found in the `release notes/documentation` folder:

1. [AI Receipt Scanning](release%20notes/documentation/01-ai-receipt-scanning.md)
2. [Travel Mode](release%20notes/documentation/02-travel-mode.md)
3. [Goals Management](release%20notes/documentation/03-goals-management.md)
4. [Dashboard & Core Transactions](release%20notes/documentation/04-core-transactions-dashboard.md)
5. [Dashboard Overview](release%20notes/documentation/05-dashboard-overview.md)
6. [Accounts & Reconciliation](release%20notes/documentation/06-accounts-management.md)
7. [Budgets Tracking](release%20notes/documentation/07-budgets-tracking.md)
8. [Subscriptions & Bills](release%20notes/documentation/08-subscriptions-bills.md)
9. [AI Chat Assistant](release%20notes/documentation/09-ai-chat-assistant.md)
10. [Native SMS Transaction Review](release%20notes/documentation/10-sms-transaction-review.md)

11. [Categories Management](release%20notes/documentation/11-categories.md)
12. [Transactions List](release%20notes/documentation/12-transactions-list.md)
13. [Settings & Profile](release%20notes/documentation/13-settings-and-profile.md)
14. [Bulk CSV Import](release%20notes/documentation/14-csv-import.md)
15. [Analytics & Reports](release%20notes/documentation/15-analytics-reports.md)
16. [Local Native Notifications](release%20notes/documentation/16-local-notifications.md)

## 🚦 Getting Started

First, install the dependencies:
```bash
npm install
```

Configure your environment variables by copying `.env.local` templates and adding your Supabase and Google Gemini AI keys.

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
