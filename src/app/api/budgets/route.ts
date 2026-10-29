import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body?.budgets as { category?: string; limit?: number }[] | undefined;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "budgets array is required" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.category || typeof item.category !== "string") continue;
      const limit = typeof item.limit === "number" && isFinite(item.limit) && item.limit >= 0 ? Math.round(item.limit * 100) / 100 : 0;
      if (limit <= 0) {
        // Remove budget if limit cleared
        await db.budget.deleteMany({ where: { category: item.category } });
        continue;
      }
      await db.budget.upsert({
        where: { category: item.category },
        update: { limit },
        create: { category: item.category, limit },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/budgets failed", e);
    return NextResponse.json({ error: "Failed to save budgets" }, { status: 500 });
  }
}
