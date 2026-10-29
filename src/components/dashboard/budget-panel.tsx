"use client";

import { motion } from "framer-motion";
import { AlertOctagon, ArrowDown, CheckCircle2, CircleAlert, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetDialog } from "./budget-dialog";
import { formatMoney, getCategoryDef } from "@/lib/finance";
import { useState } from "react";
import type { BudgetStatus } from "@/lib/finance";

const statusMeta = {
  safe: { icon: CheckCircle2, label: "On track", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  warning: { icon: CircleAlert, label: "Near limit", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  over: { icon: AlertOctagon, label: "Over budget", chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
} as const;

export function BudgetPanel({ budgets, onSaved }: { budgets: BudgetStatus[]; onSaved: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const totalLimit = budgets.reduce((a, b) => a + b.limit, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Budget Health</CardTitle>
              <p className="text-xs text-muted-foreground">Monthly limits by category</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Manage
            </Button>
          </div>

          {totalLimit > 0 && (
            <div className="pt-2">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-medium">
                  {formatMoney(totalSpent)} <span className="text-muted-foreground">of {formatMoney(totalLimit)}</span>
                </span>
                <span className={`font-bold ${totalPct >= 100 ? "text-rose-600" : totalPct >= 75 ? "text-amber-600" : "text-emerald-600"}`}>
                  {totalPct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${totalPct >= 100 ? "bg-rose-500" : totalPct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, totalPct)}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No budgets yet</p>
              <p className="max-w-[240px] text-xs text-muted-foreground">
                Set monthly limits per category and get alerts before you overspend.
              </p>
              <Button size="sm" variant="outline" className="mt-1" onClick={() => setDialogOpen(true)}>
                Create your first budget
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {budgets.map((b, i) => {
                const meta = statusMeta[b.status];
                const StatusIcon = meta.icon;
                const def = getCategoryDef(b.category, "EXPENSE");
                const Icon = def.icon;
                return (
                  <motion.div
                    key={b.category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="group"
                  >
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${def.soft}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{b.category}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={`h-full rounded-full ${meta.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, b.pct)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: "easeOut" }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="tabular-nums">
                        {formatMoney(b.spent)} of {formatMoney(b.limit)}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 tabular-nums ${b.remaining < 0 ? "font-semibold text-rose-600 dark:text-rose-400" : ""}`}>
                        {b.remaining < 0 ? (
                          <>
                            <AlertOctagon className="h-3 w-3" /> Over by {formatMoney(Math.abs(b.remaining))}
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3" /> {formatMoney(b.remaining)} left
                          </>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <BudgetDialog open={dialogOpen} onOpenChange={setDialogOpen} budgets={budgets} onSaved={onSaved} />
    </>
  );
}
