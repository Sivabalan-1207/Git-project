"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { formatMoney } from "@/lib/finance";
import type { BudgetStatus } from "@/lib/finance";

export function AlertBanner({ budgets }: { budgets: BudgetStatus[] }) {
  const alerting = budgets.filter((b) => b.status !== "safe");
  const alertKey = alerting.map((b) => b.category).join("|");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [prevAlertKey, setPrevAlertKey] = useState(alertKey);

  // Reset dismissal when the alerting set changes (adjust state during render — React-endorsed pattern)
  if (prevAlertKey !== alertKey) {
    setPrevAlertKey(alertKey);
    setDismissedKey(null);
  }

  if (alerting.length === 0 || dismissedKey === alertKey) return null;

  const over = alerting.filter((b) => b.status === "over");
  const warning = alerting.filter((b) => b.status === "warning");
  const critical = over.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl border p-4 pr-10 ${
          critical
            ? "border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 dark:border-rose-500/30 dark:from-rose-500/10 dark:to-orange-500/10"
            : "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-yellow-500/10"
        }`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={critical ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              critical ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${critical ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"}`}>
              {critical
                ? `Budget exceeded in ${over.length} ${over.length === 1 ? "category" : "categories"}`
                : `${warning.length} ${warning.length === 1 ? "budget is" : "budgets are"} close to the limit`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {alerting.map((b) => (
                <span
                  key={b.category}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.status === "over"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {b.category}
                  <span className="opacity-75">
                    {b.pct}%{b.status === "over" ? ` · over by ${formatMoney(Math.abs(b.remaining))}` : ""}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissedKey(alertKey)}
          aria-label="Dismiss budget alerts"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
