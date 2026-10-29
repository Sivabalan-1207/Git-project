"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "./count-up";
import { formatMoney } from "@/lib/finance";
import type { DashboardData } from "@/lib/finance";

function deltaPct(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((current - prev) / prev) * 1000) / 10;
}

function DeltaChip({ pct, goodWhenUp }: { pct: number | null; goodWhenUp: boolean }) {
  if (pct === null) {
    return <span className="text-xs text-white/70">— vs last month</span>;
  }
  const up = pct >= 0;
  const good = goodWhenUp ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        good ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
      <span className="font-normal text-muted-foreground">vs last month</span>
    </span>
  );
}

export function StatCards({ data }: { data: DashboardData }) {
  const { stats } = data;
  const incomeDelta = deltaPct(stats.monthIncome, stats.prevMonthIncome);
  const expenseDelta = deltaPct(stats.monthExpense, stats.prevMonthExpense);

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Available Balance — hero card */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show" whileHover={{ y: -4 }}>
        <Card className="relative h-full overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/20">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/10" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-50/90">Available Balance</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Wallet className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-[2rem]">
              <CountUp value={stats.balance} format={(n) => formatMoney(n)} />
            </p>
            <p className="mt-2 text-xs text-emerald-100/80">
              Total income − total expense, all time
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Income this month */}
      <motion.div custom={1} variants={cardVariants} initial="hidden" animate="show" whileHover={{ y: -4 }}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Income · {stats.monthLabel.split(" ")[0]}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <ArrowUpRight className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-[1.7rem]">
              +<CountUp value={stats.monthIncome} format={(n) => formatMoney(n)} />
            </p>
            <div className="mt-2">
              <DeltaChip pct={incomeDelta} goodWhenUp />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expenses this month */}
      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="show" whileHover={{ y: -4 }}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Expenses · {stats.monthLabel.split(" ")[0]}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <ArrowDownRight className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 sm:text-[1.7rem]">
              −<CountUp value={stats.monthExpense} format={(n) => formatMoney(n)} />
            </p>
            <div className="mt-2">
              <DeltaChip pct={expenseDelta} goodWhenUp={false} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Savings rate */}
      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="show" whileHover={{ y: -4 }}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <PiggyBank className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
              <CountUp value={stats.savingsRate} format={(n) => `${Math.round(n)}%`} />
            </p>
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${
                    stats.savingsRate >= 20 ? "bg-emerald-500" : stats.savingsRate >= 0 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {stats.savingsRate >= 20 ? "Healthy — above the 20% benchmark" : stats.savingsRate >= 0 ? "Try to save 20% or more" : "Spending exceeds income this month"}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
