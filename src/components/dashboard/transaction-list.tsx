"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  ListFilter,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatMoney, formatTime, getCategoryDef } from "@/lib/finance";
import type { Transaction, TxType } from "@/lib/finance";

type TypeFilter = "ALL" | TxType;

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
}

export function TransactionList({ transactions, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(t.category);
    return [...set].sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => (typeFilter === "ALL" ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === "ALL" ? true : t.category === categoryFilter))
      .filter((t) =>
        q
          ? (t.note?.toLowerCase().includes(q) ?? false) || t.category.toLowerCase().includes(q)
          : true
      )
      .slice(0, 120);
  }, [transactions, search, typeFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = formatDate(t.date);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const isFiltered = search.trim() !== "" || typeFilter !== "ALL" || categoryFilter !== "ALL";

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete.id);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Transaction History</CardTitle>
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {transactions.length} records
              </p>
            </div>
            <div className="inline-flex rounded-xl border bg-muted/40 p-1">
              {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    typeFilter === t
                      ? t === "INCOME"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : t === "EXPENSE"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "ALL" ? "All" : t === "INCOME" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes or categories…"
                className="h-9 pl-9"
                aria-label="Search transactions"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by category">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{isFiltered ? "No matching transactions" : "No transactions yet"}</p>
              <p className="text-xs text-muted-foreground">
                {isFiltered ? "Try clearing the search or filters." : "Use the Add Transaction button to get started."}
              </p>
            </div>
          ) : (
            <div className="scrollbar-thin max-h-[460px] space-y-4 overflow-y-auto pr-1 lg:max-h-[520px]">
              <AnimatePresence initial={false}>
                {grouped.map(([dayLabel, txs]) => (
                  <motion.div key={dayLabel} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="sticky top-0 z-10 -mx-1 bg-gradient-to-b from-card via-card to-card/0 px-1 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-[2px]">
                      {dayLabel}
                    </p>
                    <div className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {txs.map((t) => {
                          const def = getCategoryDef(t.category, t.type);
                          const Icon = def.icon;
                          const income = t.type === "INCOME";
                          return (
                            <motion.div
                              key={t.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-border hover:bg-muted/50"
                            >
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${def.soft}`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{t.note || t.category}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {t.category} · {formatTime(t.date)}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${income ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                {income ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                                )}
                                {income ? "+" : "−"}
                                {formatMoney(t.amount, true).replace("₹", "₹")}
                              </div>
                              <button
                                onClick={() => setPendingDelete(t)}
                                aria-label={`Delete ${t.note || t.category} transaction`}
                                className="rounded-lg p-2 text-muted-foreground/50 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `This will permanently remove "${pendingDelete.note || pendingDelete.category}" (${formatMoney(pendingDelete.amount, true)}) and update your balance, charts and budgets.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
