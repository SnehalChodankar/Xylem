"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransferFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSourceAccountId?: string;
}

export function TransferFundsDialog({ open, onOpenChange, defaultSourceAccountId }: TransferFundsDialogProps) {
  const { accounts, addTransaction, getLiveAccountBalance } = useAppStore();
  
  const [sourceAccountId, setSourceAccountId] = useState<string>(defaultSourceAccountId || "");
  const [destAccountId, setDestAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const destAccount = accounts.find((a) => a.id === destAccountId);

  // Auto-set first account if only one is available and none selected
  if (!sourceAccountId && accounts.length > 0) {
    setSourceAccountId(accounts[0].id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sourceAccountId || !destAccountId || sourceAccountId === destAccountId) {
      setError("Please select different source and destination accounts.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        account_id: sourceAccountId,
        to_account_id: destAccountId,
        type: "transfer",
        amount: numAmount,
        date,
        description: `Transfer to ${destAccount?.name}`,
        notes: notes || undefined,
      });
      
      onOpenChange(false);
      
      // Reset form
      setAmount("");
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setDestAccountId("");
    } catch (err: any) {
      setError(err.message || "Failed to process transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Self Transfer
          </DialogTitle>
          <DialogDescription>
            Move funds between your existing accounts. This will not affect your income or expense reports.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
              <span className="font-semibold">Error:</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Source Account */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Account</Label>
            <Select value={sourceAccountId} onValueChange={(v) => v && setSourceAccountId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account">
                  {sourceAccount ? `${sourceAccount.icon} ${sourceAccount.name}` : "Select source account"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center justify-between w-full pr-4 gap-4">
                      <span>{acc.icon} {acc.name}</span>
                      <span className="text-muted-foreground text-xs">{formatCurrency(getLiveAccountBalance(acc.id))}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="bg-background border rounded-full p-1.5 shadow-sm text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4 rotate-90" />
            </div>
          </div>

          {/* Destination Account */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Account</Label>
            <Select value={destAccountId} onValueChange={(v) => v && setDestAccountId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination account">
                  {destAccount ? `${destAccount.icon} ${destAccount.name}` : "Select destination account"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.id !== sourceAccountId).map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center justify-between w-full pr-4 gap-4">
                      <span>{acc.icon} {acc.name}</span>
                      <span className="text-muted-foreground text-xs">{formatCurrency(getLiveAccountBalance(acc.id))}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-8 text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (Optional)</Label>
            <Input
              placeholder="e.g. Moved to savings"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-xl mt-2"
            disabled={isSubmitting || !sourceAccountId || !destAccountId || !amount}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
