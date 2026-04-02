# Xylem Finance — Roadmap & Future Enhancements (v1.1+)

This document outlines potential features and integrations for future versions of Xylem Finance following the successful v1.0.0 rollout.

---

## 1. 🤖 AI Financial Insights & Chat
*   **Concept**: Integrate an LLM (like OpenAI's GPT-4o or Google's Gemini) connected securely to the user's PostgreSQL database to create a "Finance Chat" tab.
*   **User Action**: Users could ask "Am I spending too much on food this month?" or "Chart my travel expenses over the last year."
*   **Technical**: Use LangChain/LlamaIndex with Supabase Edge Functions or Next.js API routes securely passing the user's filtered data scope to the LLM context.

## 2. 🧾 Receipt Scanning (OCR)
*   **Concept**: Eliminate manual entry entirely by snapping photos of store receipts.
*   **User Action**: Click the camera icon in "Add Transaction", take a picture, and suddenly the Amount, Date, and Merchant are all auto-filled.
*   **Technical**: Process images via Google Cloud Vision API or AWS Textract to extract text and regex match the required fields.

## 3. 🔄 Recurring Transactions Engine
*   **Concept**: Background automation for subscriptions like Spotify, Rent, Gym Memberships.
*   **User Action**: On the Add Transaction page, tick a box stating "This repeats monthly on the 1st."
*   **Technical**: The database already has `is_recurring` fields ready. We require a `pg_cron` job running inside Supabase that scans a `recurring_rules` table every night at midnight to insert the new row into the `transactions` table.

## 4. 🔔 Smart Push Notifications
*   **Concept**: Timely financial reminders directly to iOS/Android lock screens without installing a native App Store app.
*   **User Action**: Receive a notification stating "You've hit 90% of your Shopping budget this month!" or a daily 8:00 PM nudge to "Log your daily expenses".
*   **Technical**: Expand the current PWA Service Worker to listen to the Web Push API, triggered by a nightly Supabase Edge Function mapping over user subscription tokens.

## 5. 🏦 Live Bank Syncing (Plaid)
*   **Concept**: Skip CSV uploads entirely by directly linking bank accounts.
*   **User Action**: User successfully authenticates their bank and transactions magically appear in Xylem when they open the app.
*   **Technical**: Integrate Plaid Link natively into the React frontend to obtain an Access Token, then periodically hit Plaid's `/transactions/sync` endpoint via a Supabase background webhook.

## 6. 🌍 Multi-Currency / Travel Mode
*   **Concept**: Support for standardizing expenses while on holiday in different countries.
*   **User Action**: Input an expense as "25 EUR in Paris" and have Xylem automatically log it against your home currency (e.g., USD) using that day's exchange rate.
*   **Technical**: Form interaction fetching live spot rates from a free API (like Currency-api or ExchangeRates) when the currency dropdown is shifted away from the default locale.

## 7. 🔑 Google / Apple Authenticator (OAuth)
*   **Concept**: Frictionless signup without managing passwords.
*   **User Action**: "Sign in with Google" straight into the dashboard.
*   **Technical**: Enable OAuth Providers inside the Supabase Auth Dashboard and set up the respective Client IDs and Secrets in the Google Cloud Console.
