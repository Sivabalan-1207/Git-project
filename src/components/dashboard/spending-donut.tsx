"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";
import { formatCompact, formatMoney, getCategoryDef } from "@/lib/finance";
import type { CategorySlice } from "@/lib/finance";

interface Slice extends CategorySlice {
  color: string;
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{s.category}</p>
      <p className="text-sm font-bold">{formatMoney(s.amount)}</p>
      <p className="text-xs text-muted-foreground">
        {s.pct}% of spend · {s.count} {s.count === 1 ? "txn" : "txns"}
      </p>
    </div>
  );
}

export function SpendingDonut({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const data: Slice[] = slices.map((s) => ({ ...s, color: getCategoryDef(s.category, "EXPENSE").color }));
  const top = data[0];

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Category-wise Expenses</CardTitle>
            <p className="text-xs text-muted-foreground">Where your money went this month</p>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400 sm:flex">
            <PieIcon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {data.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <PieIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No expenses yet this month</p>
            <p className="text-xs text-muted-foreground">Add an expense to see the breakdown</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative h-[220px] w-[220px] shrink-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius="68%"
                    outerRadius="95%"
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                    animationDuration={900}
                    animationBegin={200}
                  >
                    {data.map((d) => (
                      <Cell key={d.category} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total spent</p>
                <p className="text-xl font-bold">{formatCompact(total)}</p>
              </div>
            </motion.div>

            <div className="scrollbar-thin max-h-[220px] w-full flex-1 space-y-1 overflow-y-auto pr-1 lg:max-h-[260px]">
              {data.map((s, i) => (
                <motion.div
                  key={s.category}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.category}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.count} {s.count === 1 ? "transaction" : "transactions"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatMoney(s.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{s.pct}%</p>
                  </div>
                </motion.div>
              ))}
              {top && top.pct > 0 && (
                <p className="pt-1 text-center text-[11px] text-muted-foreground lg:text-left">
                  Biggest slice: <span className="font-semibold text-foreground">{top.category}</span> at {top.pct}%
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
