"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ShieldCheck, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [isLoginWalkthrough, setIsLoginWalkthrough] = useState(true);

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden relative">
      {/* Ambient background (global for the page) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />
      
      {/* LEFT PANE: Marketing Details (Hidden on Mobile) */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-16 lg:px-24 relative z-10 border-r border-border/50 bg-card/10 backdrop-blur-sm">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Xylem Finance"
            className="h-20 w-auto object-contain drop-shadow-[0_4px_24px_rgba(34,197,94,0.35)] mb-8"
          />
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">money.</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-lg">
            Join thousands of users tracking their expenses, managing budgets, and growing their wealth securely with Xylem.
          </p>
        </div>

        <div className="space-y-8 max-w-md">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">10,000+ Active Users</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Trusted globally. Our robust platform handles millions of transactions effortlessly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
              <TrendingUp className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Intelligent Analytics</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Beautiful charts and automated CSV parsing turn raw data into actionable insights instantly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Bank-Level Security</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Your data is exclusively yours. Secured by PostgreSQL Row-Level Security parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Authentication Forms (Full screen on mobile) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        {/* Decorative ambient lighting for the right pane */}
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none hidden md:block" />
        
        <div className="w-full max-w-sm">
          {isLoginWalkthrough ? (
            <LoginForm onToggleMode={() => setIsLoginWalkthrough(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLoginWalkthrough(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
