"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Sparkles, Wallet, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { StatCards } from "@/components/dashboard/stat-cards";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { SpendingDonut } from "@/components/dashboard/spending-donut";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { BudgetPanel } from "@/components/dashboard/budget-panel";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { formatMoney } from "@/lib/finance";
import type { DashboardData } from "@/lib/finance";

function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

const subscribeNoop = () => () => {};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <div className="h-9 w-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      className="h-9 w-9 rounded-xl"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </Button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl xl:col-span-2" />
      </div>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      setData((await res.json()) as DashboardData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdded = useCallback(async () => {
    await load();
    toast({ title: "Transaction added", description: "Your balance and charts are up to date." });
  }, [load, toast]);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        await load();
        toast({ title: "Transaction deleted", description: "It has been removed from your history." });
      } else {
        toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
      }
    },
    [load, toast]
  );

  const handleBudgetSaved = useCallback(async () => {
    await load();
    toast({ title: "Budgets saved", description: "Budget alerts will now track the new limits." });
  }, [load, toast]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <motion.div
              initial={{ rotate: -12, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
            >
              <Wallet className="h-4.5 w-4.5" />
            </motion.div>
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-base font-bold tracking-tight">
                SpendWise <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">AI</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Track smart · Spend wise</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => setAddOpen(true)}
              className="hidden gap-1.5 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <DashboardSkeleton />
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <WifiOff className="h-6 w-6" />
            </div>
            <p className="font-semibold">Couldn&apos;t load your dashboard</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Something went wrong while fetching your finances. Check your connection and try again.
            </p>
            <Button onClick={load} variant="outline" className="mt-1 gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <StatCards data={data} />

            <AlertBanner budgets={data.budgets} />

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <SpendingDonut slices={data.categoryBreakdown} total={data.stats.monthExpense} />
              <TrendChart trend={data.trend} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
              <BudgetPanel budgets={data.budgets} onSaved={handleBudgetSaved} />
              <div className="xl:col-span-2">
                <TransactionList transactions={data.transactions} onDelete={handleDelete} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/60 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            SpendWise AI · Track smart, spend wise
          </p>
          {data && (
            <p className="tabular-nums">
              Balance {formatMoney(data.stats.balance)} · {data.transactions.length} transactions tracked
            </p>
          )}
        </div>
      </footer>

      {/* Mobile FAB */}
      <motion.button
        onClick={() => setAddOpen(true)}
        aria-label="Add transaction"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 18 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/35 transition-colors hover:bg-emerald-700 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AddTransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        budgets={data?.budgets ?? []}
        onAdded={handleAdded}
      />
    </div>
  );
}
