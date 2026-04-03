"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Info } from "lucide-react";

export function DisclaimerDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem("hide-disclaimer-login");
    if (!hidden) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("hide-disclaimer-login", "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] border-amber-500/20 bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <ShieldAlert className="h-5 w-5" />
            Security & Privacy Disclaimer
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 text-sm leading-relaxed text-muted-foreground">
          <div className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="font-medium">Please read carefully before proceeding.</p>
          </div>
          
          <p>
            Xylem Finance uses your uploaded data to provide financial insights. 
            By using this application, you acknowledge and agree to the following:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="font-semibold text-foreground">Data Privacy:</span> 
              Your bank statements and account details are processed to categorize transactions. 
              Always ensure your CSV files do not contain passwords, PINs, or full account numbers.
            </li>
            <li>
              <span className="font-semibold text-foreground">Liability:</span> 
              The application and its developers are NOT liable for any financial loss, 
              data breaches, or inaccuracies arising from the use of this software.
            </li>
            <li>
              <span className="font-semibold text-foreground">Usage:</span> 
              You are responsible for the accuracy of the data you import and the security of 
              your own device.
            </li>
          </ul>

          <p className="italic text-xs border-t border-border pt-4">
            Note: This app is for personal finance tracking. We do not provide professional 
            financial advice.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center bg-muted/30 -mx-6 -mb-6 p-4 px-6 border-t">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">Don&apos;t show this again</span>
          </label>
          <Button onClick={handleClose} className="rounded-xl px-8 font-semibold">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
