import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  Home,
  GraduationCap,
  Shapes,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

export type TxType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  pct: number;
  remaining: number;
  status: "safe" | "warning" | "over";
}

export interface CategorySlice {
  category: string;
  amount: number;
  count: number;
  pct: number;
}

export interface TrendPoint {
  month: string; // "Jan"
  income: number;
  expense: number;
}

export interface DashboardData {
  transactions: Transaction[];
  stats: {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    monthIncome: number;
    monthExpense: number;
    prevMonthIncome: number;
    prevMonthExpense: number;
    savingsRate: number;
    monthLabel: string;
  };
  categoryBreakdown: CategorySlice[];
  trend: TrendPoint[];
  budgets: BudgetStatus[];
}

/* ---------------- Categories ---------------- */

export interface CategoryDef {
  name: string;
  icon: LucideIcon;
  color: string; // hex used in charts
  soft: string; // tailwind classes for icon chip background
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: "Food & Dining", icon: UtensilsCrossed, color: "#f97316", soft: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400" },
  { name: "Groceries", icon: ShoppingCart, color: "#22c55e", soft: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400" },
  { name: "Transport", icon: Car, color: "#06b6d4", soft: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400" },
  { name: "Shopping", icon: ShoppingBag, color: "#ec4899", soft: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400" },
  { name: "Bills & Utilities", icon: Receipt, color: "#eab308", soft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" },
  { name: "Entertainment", icon: Clapperboard, color: "#a855f7", soft: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400" },
  { name: "Health", icon: HeartPulse, color: "#ef4444", soft: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" },
  { name: "Rent & Housing", icon: Home, color: "#14b8a6", soft: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400" },
  { name: "Education", icon: GraduationCap, color: "#8b5cf6", soft: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" },
  { name: "Other", icon: Shapes, color: "#64748b", soft: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400" },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { name: "Salary", icon: Briefcase, color: "#10b981", soft: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" },
  { name: "Freelance", icon: Laptop, color: "#14b8a6", soft: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400" },
  { name: "Investments", icon: TrendingUp, color: "#84cc16", soft: "bg-lime-100 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400" },
  { name: "Gifts", icon: Gift, color: "#f43f5e", soft: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" },
  { name: "Other Income", icon: CircleDollarSign, color: "#0d9488", soft: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
];

export function getCategoryDef(name: string, type?: TxType): CategoryDef {
  const pool = type === "INCOME" ? INCOME_CATEGORIES : type === "EXPENSE" ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return (
    pool.find((c) => c.name === name) ??
    { name, icon: Shapes, color: "#64748b", soft: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400" }
  );
}

/* ---------------- Formatting ---------------- */

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(n: number, decimals = false): string {
  return decimals ? inr2.format(n) : inr0.format(n);
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
