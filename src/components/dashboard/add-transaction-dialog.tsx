"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowDownLeft, ArrowDownRight, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMoney, getCategoryDef } from "@/lib/finance";
import type { BudgetStatus, TxType } from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: BudgetStatus[];
  onAdded: () => Promise<void> | void;
}

const QUICK_AMOUNTS = [100, 500, 1000];

export function AddTransactionDialog({ open, onOpenChange, budgets, onAdded }: Props) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const parsedAmount = parseFloat(amount) || 0;
  const valid = parsedAmount > 0 && !!category && !saving;

  const budgetForCategory = useMemo(
    () => (category ? budgets.find((b) => b.category === category) : undefined),
    [category, budgets]
  );

  function resetForm(nextType?: TxType) {
    setAmount("");
    setCategory(null);
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setSuccess(false);
    if (nextType) setType(nextType);
  }

  function switchType(t: TxType) {
    if (t === type) return;
    setType(t);
    setCategory(null);
  }

  async function handleSubmit() {
    if (!valid || !category) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          category,
          note: note.trim() || undefined,
          date: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to save");
      }
      setSuccess(true);
      await onAdded();
      // Close after a short success beat
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 650);
    } catch {
      alert("Could not save the transaction. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Log money in or out in three quick steps — type, amount, category.</DialogDescription>
        </DialogHeader>

        {/* Step 1 — type toggle */}
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
            CHOOSE TYPE
          </div>
          <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            {(["EXPENSE", "INCOME"] as const).map((t) => {
              const active = type === t;
              const Icon = t === "EXPENSE" ? ArrowUpRight : ArrowDownLeft;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchType(t)}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? t === "EXPENSE"
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  {active && (
                    <motion.span
                      layoutId="type-pill"
                      className={`absolute inset-0 -z-10 rounded-xl shadow-sm ${
                        t === "EXPENSE" ? "bg-rose-500/15 ring-1 ring-rose-500/40" : "bg-emerald-500/15 ring-1 ring-emerald-500/40"
                      }`}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — amount */}
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
            ENTER AMOUNT
          </div>
          <div
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 bg-muted/30 py-4 transition-colors focus-within:border-primary/60 ${
              type === "EXPENSE" ? "border-rose-500/30" : "border-emerald-500/30"
            }`}
          >
            <span className={`text-3xl font-bold ${type === "EXPENSE" ? "text-rose-500" : "text-emerald-500"}`}>₹</span>
            <Input
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                if ((v.match(/\./g) ?? []).length <= 1) setAmount(v);
              }}
              placeholder="0"
              inputMode="decimal"
              autoFocus
              aria-label="Amount in rupees"
              className="h-auto border-0 bg-transparent p-0 text-center text-3xl font-bold shadow-none focus-visible:ring-0 [appearance:textfield] w-40 sm:w-48 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String((parseFloat(amount) || 0) + q))}
                className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                +{formatMoney(q)}
              </button>
            ))}
            {amount && (
              <button
                type="button"
                onClick={() => setAmount("")}
                className="rounded-full px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Step 3 — category */}
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
            PICK A CATEGORY
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <AnimatePresence mode="wait">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.name;
                return (
                  <motion.button
                    key={cat.name}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/60"
                    }`}
                    aria-pressed={active}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.soft}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium leading-tight">{cat.name}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Optional details */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tx-note" className="text-xs text-muted-foreground">
              Note (optional)
            </Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === "EXPENSE" ? "e.g. Lunch at cafe" : "e.g. Salary credit"}
              maxLength={60}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input id="tx-date" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="h-9" />
          </div>
        </div>

        {/* Budget hint */}
        <AnimatePresence>
          {type === "EXPENSE" && budgetForCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden rounded-xl px-3 py-2 text-xs ${
                budgetForCategory.status === "over"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : budgetForCategory.status === "warning"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {budgetForCategory.category} budget: {formatMoney(budgetForCategory.spent)} of {formatMoney(budgetForCategory.limit)} used (
              {budgetForCategory.pct}%)
              {budgetForCategory.status === "over" ? " — already over the limit!" : budgetForCategory.status === "warning" ? " — close to the limit" : ""}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!valid}
          size="lg"
          className={`w-full gap-2 text-base font-semibold ${
            type === "EXPENSE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
          } text-white`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {success ? (
              <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check className="h-5 w-5" /> Added!
              </motion.span>
            ) : saving ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Saving…
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                {type === "EXPENSE" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                Add {type === "EXPENSE" ? "Expense" : "Income"} {parsedAmount > 0 && `· ${formatMoney(parsedAmount)}`}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
