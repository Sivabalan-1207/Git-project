import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Deterministic pseudo-random for stable seed data
let seedState = 42;
function rand(max: number, min = 0) {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  const r = (seedState / 2147483648) * (max - min) + min;
  return Math.round(r * 100) / 100;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand(arr.length - 0.001, 0))];
}

type Tpl = { category: string; notes: string[]; min: number; max: number; times: [number, number] };

const expenseTemplates: Tpl[] = [
  { category: "Food & Dining", notes: ["Lunch at cafe", "Swiggy order", "Dinner with friends", "Coffee run", "Office canteen"], min: 120, max: 850, times: [10, 14] },
  { category: "Groceries", notes: ["BigBasket monthly", "Vegetables & fruits", "DMart run", "Milk & essentials"], min: 400, max: 2800, times: [3, 5] },
  { category: "Transport", notes: ["Uber to office", "Metro card recharge", "Petrol fill", "Ola ride"], min: 90, max: 1500, times: [4, 7] },
  { category: "Shopping", notes: ["Amazon order", "New sneakers", "Kurta set", "Home decor"], min: 500, max: 3500, times: [1, 3] },
  { category: "Bills & Utilities", notes: ["Electricity bill", "Mobile recharge", "Broadband bill", "Water bill"], min: 300, max: 2200, times: [2, 4] },
  { category: "Entertainment", notes: ["Netflix subscription", "Movie tickets", "Concert pass", "Spotify premium"], min: 199, max: 1600, times: [1, 3] },
  { category: "Health", notes: ["Pharmacy", "Gym membership", "Doctor visit", "Health checkup"], min: 250, max: 2500, times: [0, 2] },
];

const incomeTemplates = [
  { category: "Salary", note: "Monthly salary credit", min: 72000, max: 78000 },
  { category: "Freelance", note: "Client project payment", min: 8000, max: 24000 },
  { category: "Investments", note: "Dividend payout", min: 1200, max: 4200 },
];

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await db.transaction.deleteMany();
    await db.budget.deleteMany();
    console.log("Cleared existing data.");
  }
  const count = await db.transaction.count();
  if (count > 0) {
    console.log(`Database already has ${count} transactions — skipping seed.`);
    return;
  }

  const now = new Date();
  const txs: { type: string; amount: number; category: string; note: string; date: Date }[] = [];

  // Generate expenses for the last 6 months
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const maxDay = m === 0 ? now.getDate() : daysInMonth;

    // Rent on the 3rd of each month
    if (maxDay >= 3) {
      txs.push({ type: "EXPENSE", amount: 18000, category: "Rent & Housing", note: "Monthly house rent", date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3, 10, 0) });
    }

    for (const tpl of expenseTemplates) {
      const n = Math.round(rand(tpl.times[1], tpl.times[0]));
      for (let i = 0; i < n; i++) {
        const day = Math.max(1, Math.min(maxDay, Math.round(rand(maxDay, 1))));
        txs.push({
          type: "EXPENSE",
          amount: rand(tpl.max, tpl.min),
          category: tpl.category,
          note: pick(tpl.notes),
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day, rand(21, 8), rand(59, 0)),
        });
      }
    }

    // Income: salary on 1st, freelance occasionally
    txs.push({
      type: "INCOME",
      amount: rand(incomeTemplates[0].max, incomeTemplates[0].min),
      category: "Salary",
      note: incomeTemplates[0].note,
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 9, 30),
    });
    if (rand(1, 0) > 0.35) {
      const day = Math.max(1, Math.min(maxDay, Math.round(rand(25, 8))));
      txs.push({
        type: "INCOME",
        amount: rand(incomeTemplates[1].max, incomeTemplates[1].min),
        category: "Freelance",
        note: incomeTemplates[1].note,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 16, 0),
      });
    }
    if (rand(1, 0) > 0.5) {
      const day = Math.max(1, Math.min(maxDay, Math.round(rand(20, 5))));
      txs.push({
        type: "INCOME",
        amount: rand(incomeTemplates[2].max, incomeTemplates[2].min),
        category: "Investments",
        note: incomeTemplates[2].note,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0),
      });
    }
  }

  await db.transaction.createMany({ data: txs });

  const budgets = [
    { category: "Food & Dining", limit: 8000 },
    { category: "Groceries", limit: 6000 },
    { category: "Transport", limit: 3500 },
    { category: "Shopping", limit: 5000 },
    { category: "Bills & Utilities", limit: 5000 },
    { category: "Entertainment", limit: 3000 },
    { category: "Rent & Housing", limit: 18000 },
    { category: "Health", limit: 3000 },
  ];
  for (const b of budgets) {
    await db.budget.upsert({ where: { category: b.category }, update: { limit: b.limit }, create: b });
  }

  console.log(`Seeded ${txs.length} transactions and ${budgets.length} budgets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
