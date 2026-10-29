import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BudgetStatus, CategorySlice, DashboardData, Transaction, TrendPoint, TxType } from "@/lib/finance";

export const dynamic = "force-dynamic";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  const [txs, budgets] = await Promise.all([
    db.transaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    db.budget.findMany({ orderBy: { category: "asc" } }),
  ]);

  const transactions: Transaction[] = txs.map((t) => ({
    id: t.id,
    type: t.type as TxType,
    amount: t.amount,
    category: t.category,
    note: t.note,
    date: t.date.toISOString(),
  }));

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  let balance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let monthIncome = 0;
  let monthExpense = 0;
  let prevMonthIncome = 0;
  let prevMonthExpense = 0;

  const catMap = new Map<string, { amount: number; count: number }>();

  for (const t of txs) {
    const time = t.date.getTime();
    if (t.type === "INCOME") {
      balance += t.amount;
      totalIncome += t.amount;
      if (time >= thisMonth) monthIncome += t.amount;
      if (time >= prevMonth && time < thisMonth) prevMonthIncome += t.amount;
    } else {
      balance -= t.amount;
      totalExpense += t.amount;
      if (time >= thisMonth) monthExpense += t.amount;
      if (time >= prevMonth && time < thisMonth) prevMonthExpense += t.amount;

      if (time >= thisMonth) {
        const entry = catMap.get(t.category) ?? { amount: 0, count: 0 };
        entry.amount += t.amount;
        entry.count += 1;
        catMap.set(t.category, entry);
      }
    }
  }

  const categoryBreakdown: CategorySlice[] = [...catMap.entries()]
    .map(([category, v]) => ({
      category,
      amount: Math.round(v.amount * 100) / 100,
      count: v.count,
      pct: monthExpense > 0 ? Math.round((v.amount / monthExpense) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 6-month trend (including current month)
  const trend: TrendPoint[] = [];
  for (let m = 5; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 1).getTime();
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      const time = t.date.getTime();
      if (time >= start && time < end) {
        if (t.type === "INCOME") income += t.amount;
        else expense += t.amount;
      }
    }
    trend.push({
      month: MONTH_ABBR[new Date(now.getFullYear(), now.getMonth() - m, 1).getMonth()],
      income: Math.round(income),
      expense: Math.round(expense),
    });
  }

  const budgetStatuses: BudgetStatus[] = budgets.map((b) => {
    // spent is computed for the current month
    let spent = 0;
    for (const t of txs) {
      if (t.type === "EXPENSE" && t.category === b.category && t.date.getTime() >= thisMonth) {
        spent += t.amount;
      }
    }
    const pct = b.limit > 0 ? Math.round((spent / b.limit) * 1000) / 10 : 0;
    const status: BudgetStatus["status"] = pct > 100 ? "over" : pct >= 75 ? "warning" : "safe";
    return {
      category: b.category,
      limit: b.limit,
      spent: Math.round(spent * 100) / 100,
      pct,
      remaining: Math.round((b.limit - spent) * 100) / 100,
      status,
    };
  });

  const data: DashboardData = {
    transactions,
    stats: {
      balance: Math.round(balance * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      monthIncome: Math.round(monthIncome * 100) / 100,
      monthExpense: Math.round(monthExpense * 100) / 100,
      prevMonthIncome: Math.round(prevMonthIncome * 100) / 100,
      prevMonthExpense: Math.round(prevMonthExpense * 100) / 100,
      savingsRate: monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 1000) / 10 : 0,
      monthLabel: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    },
    categoryBreakdown,
    trend,
    budgets: budgetStatuses,
  };

  return NextResponse.json(data);
}
