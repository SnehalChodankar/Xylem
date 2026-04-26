"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ShieldCheck, TrendingUp, Users, CheckCircle2, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isLoginWalkthrough, setIsLoginWalkthrough] = useState(true);

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden relative">
      {/* Absolute top right App Download Portal */}
      <div className="absolute top-6 right-6 md:right-12 z-50 hidden sm:block">
        <Dialog>
            <DialogTrigger>
                <div className="group relative inline-flex items-center justify-center gap-3 bg-zinc-950 text-white px-5 py-2.5 rounded-2xl cursor-pointer transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] border border-zinc-800 hover:border-emerald-500/40 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M4.6 2.1C4.2 2.3 4 2.8 4 3.4v17.2c0 .6.2 1.1.6 1.3l10.1-10.1L4.6 2.1z" fill="#00E676" />
                       <path d="M15.4 12.5l2.9 2.9-13.7 7.9c.4.2.9.1 1.3-.1l13.7-7.9-4.2-2.8z" fill="#F44336" />
                       <path d="M15.4 11.5l4.2-2.8-13.7-7.9c-.4-.2-.9-.3-1.3-.1L18.3 8.6l-2.9 2.9z" fill="#FFEB3B" />
                       <path d="M19.6 8.6l2.3 1.3c.7.4.7 1.5 0 1.9l-2.3 1.3-4.2-2.7 4.2-2.8z" fill="#2196F3" />
                    </svg>
                    <div className="flex flex-col items-start leading-[1.1] relative z-10 pr-2">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Download for</span>
                        <span className="text-[15px] font-bold tracking-wide">Android OS</span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md text-center flex flex-col items-center border-border/50 bg-card">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Download Xylem Finance</DialogTitle>
                    <DialogDescription className="text-center mt-2 max-w-[280px] mx-auto">
                        Scan this code with your phone camera to instantly download the standalone APK bundle for Background tracking!
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-white p-4 rounded-2xl shadow-sm border mt-4">
                    <QRCode value="https://xylems.vercel.app/xylem-finance.apk" size={200} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-4 font-medium uppercase tracking-wider">
                    Requires Android 8.0+
                </p>
                <div className="text-[10px] text-muted-foreground/70 mt-2 text-left px-2 leading-relaxed space-y-1.5 border border-amber-500/20 bg-amber-500/5 rounded-lg p-2.5">
                    <p>
                        <b>Note:</b> Play Protect may flag this sideloaded app due to SMS Sync permissions. Tap <b>"More details"</b> ➔ <b>"Install anyway"</b>.
                    </p>
                    <p>
                        <b className="text-amber-500/80">Install blocked?</b> On newer Android devices, you may need to temporarily pause <i>Google Play Protect</i> in your device settings to allow the installation.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
      </div>

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
