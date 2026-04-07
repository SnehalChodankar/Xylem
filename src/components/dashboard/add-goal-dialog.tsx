"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAppStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const EMOJI_PRESETS = ["🎯", "🚗", "🏠", "✈️", "📱", "💍", "🎓", "🏥", "💼", "🌍", "🎮", "🛒", "💰", "🏋️", "🐶"];
const COLOR_PRESETS = [
  "#22c55e", "#3b82f6", "#a78bfa", "#f59e0b",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16",
];


interface AddGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  name: string;
  target_amount: number;
  deadline?: string;
  account_id?: string;
};


export function AddGoalDialog({ open, onClose }: AddGoalDialogProps) {
  const { addGoal, accounts } = useAppStore();
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [selectedColor, setSelectedColor] = useState("#22c55e");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("none");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);
    await addGoal({
      name: values.name,
      target_amount: parseFloat(String(values.target_amount)),
      deadline: values.deadline || undefined,
      account_id: values.account_id === "none" ? null : (values.account_id ?? null),
      icon: selectedIcon,
      color: selectedColor,
    });
    reset();
    setSelectedIcon("🎯");
    setSelectedColor("#22c55e");
    setSelectedAccountId("none");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Icon & Color Picker */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      selectedIcon === emoji
                        ? "ring-2 ring-primary bg-primary/10 scale-105"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Color</Label>
              <div className="flex flex-wrap gap-1.5 max-w-[100px]">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: selectedColor + "20", borderColor: selectedColor + "40", border: "1px solid" }}
          >
            <span className="text-2xl">{selectedIcon}</span>
            <span className="font-semibold text-sm" style={{ color: selectedColor }}>
              {watch("name") || "Your Goal Name"}
            </span>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Goal Name</Label>
            <Input {...register("name", { required: "Goal name is required" })} placeholder="e.g. Emergency Fund, New Car…" className="h-10" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message ?? "Required"}</p>}
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Target Amount (₹)</Label>
            <Input {...register("target_amount", { required: true, min: 1, valueAsNumber: true })} type="number" placeholder="50000" className="h-10" />
            {errors.target_amount && <p className="text-xs text-destructive">Target must be at least ₹1</p>}
          </div>

          {/* Link Account */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Link to Account (optional)</Label>
            <Select
              value={selectedAccountId}
              onValueChange={(val: string | null) => {
                setSelectedAccountId(val || "none");
                setValue("account_id", !val || val === "none" ? undefined : val);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select account…">
                  {selectedAccountId === "none"
                    ? "No account linked"
                    : accounts.find((a) => a.id === selectedAccountId)?.name ||
                      "Select account…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account linked</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Deadline (optional)</Label>
            <Input {...register("deadline")} type="date" className="h-10" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl font-semibold"
              style={{ backgroundColor: selectedColor, color: "#fff" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
