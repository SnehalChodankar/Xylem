import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Xylem Finance",
  description: "Privacy Policy for Xylem Finance - Your personal expense tracking companion.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <a href="/" className="text-sm text-primary hover:underline font-medium">← Back to Xylem Finance</a>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 19, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>
              Xylem Finance (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is a personal finance tracking application. 
              We are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p><strong className="text-foreground">Account Information:</strong> When you sign up, we collect your email address and name (via Google OAuth or email/password registration) solely for authentication purposes.</p>
            <p><strong className="text-foreground">Financial Data:</strong> All transaction data, budgets, categories, goals, and other financial records you enter are stored securely in your private account. This data is exclusively yours.</p>
            <p><strong className="text-foreground">SMS Data (Android only):</strong> If you choose to use the SMS sync feature, the app reads your bank SMS messages locally on your device to extract transaction details. SMS content is processed on-device and only the parsed transaction metadata (amount, date, description) is sent to our servers — never the raw SMS text.</p>
            <p><strong className="text-foreground">Receipt Images (optional):</strong> If you use the receipt scanning feature, images are sent to Google&apos;s Gemini AI for text extraction and are not stored on our servers.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To provide and maintain the Xylem Finance service</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To display your financial data, analytics, and insights exclusively to you</li>
              <li>To send local push notifications (reminders) if you opt in</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>
              Your data is secured using industry-standard measures:
            </p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Row-Level Security (RLS):</strong> PostgreSQL RLS ensures that each user can only access their own data at the database level.</li>
              <li><strong className="text-foreground">Encryption in transit:</strong> All data is transmitted over HTTPS/TLS.</li>
              <li><strong className="text-foreground">Authentication:</strong> Secured by Supabase Auth with support for OAuth 2.0 and JWT tokens.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
            <p>
              We do <strong className="text-foreground">not</strong> sell, trade, or share your personal or financial data with any third parties. Your data is exclusively yours. 
              We do not run advertisements or use your data for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Supabase:</strong> For database hosting, authentication, and backend infrastructure.</li>
              <li><strong className="text-foreground">Google OAuth:</strong> For optional Google sign-in authentication.</li>
              <li><strong className="text-foreground">Google Gemini AI:</strong> For optional receipt image scanning (images are not stored).</li>
              <li><strong className="text-foreground">Vercel:</strong> For web application hosting.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Data Retention &amp; Deletion</h2>
            <p>
              Your data is retained as long as your account is active. You may delete your account and all associated data at any time by contacting us. 
              Upon deletion, all your financial records, transactions, and personal information are permanently removed from our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Children&apos;s Privacy</h2>
            <p>
              Xylem Finance is not directed to children under the age of 13. We do not knowingly collect information from children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p>
              If you have any questions or concerns about this privacy policy, please reach out to us at: <br />
              <a href="mailto:support@xylem.finance" className="text-primary hover:underline font-medium">support@xylem.finance</a>
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Xylem Finance. All rights reserved.
        </div>
      </div>
    </div>
  );
}
