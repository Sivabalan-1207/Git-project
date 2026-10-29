"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryDef } from "@/lib/finance";
import { formatMoney } from "@/lib/finance";
import { EXPENSE_CATEGORIES } from "@/lib/finance";
import { Loader2, PiggyBank } from "lucide-react";
import type { BudgetStatus } from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: BudgetStatus[];
  onSaved: () => void;
}

export function BudgetDialog({ open, onOpenChange, budgets, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form values from current budgets when dialog opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const cat of EXPENSE_CATEGORIES) {
        const b = budgets.find((x) => x.category === cat.name);
        initial[cat.name] = b ? String(b.limit) : "";
      }
      setValues(initial);
    }
  }, [open, budgets]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of budgets) map[b.category] = b.spent;
    return map;
  }, [budgets]);

  const total = useMemo(
    () => Object.values(values).reduce((a, v) => a + (parseFloat(v) || 0), 0),
    [values]
  );

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(values)
        .map(([category, v]) => ({ category, limit: parseFloat(v) || 0 }))
        .filter((x) => x.limit >= 0);
      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgets: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
      onOpenChange(false);
    } catch {
      alert("Could not save budgets. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <PiggyBank className="h-4 w-4" />
            </span>
            Manage Budgets
          </DialogTitle>
          <DialogDescription>
            Set a monthly spending limit for each category. Leave blank or 0 to remove a budget.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-2.5">
            {EXPENSE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const spent = spentByCategory[cat.name] ?? 0;
              return (
                <div key={cat.name} className="flex items-center gap-3 rounded-xl border p-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cat.soft}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cat.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Spent this month: {formatMoney(spent)}
                    </p>
                  </div>
                  <div className="relative w-28 shrink-0 sm:w-32">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      placeholder="No limit"
                      className="h-9 pl-7 text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={values[cat.name] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [cat.name]: e.target.value }))}
                      aria-label={`Monthly budget for ${cat.name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Total monthly limit: <span className="font-bold text-foreground tabular-nums">{formatMoney(total)}</span>
          </p>
          <Button onClick={handleSave} disabled={saving} className="min-w-28">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save budgets"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
