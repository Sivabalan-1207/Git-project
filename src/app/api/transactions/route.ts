import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, category, note, date } = body as {
      type?: string;
      amount?: number;
      category?: string;
      note?: string;
      date?: string;
    };

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
    if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const tx = await db.transaction.create({
      data: {
        type,
        amount: Math.round(amount * 100) / 100,
        category: category.trim(),
        note: note?.trim() ? note.trim() : null,
        date: parsedDate,
      },
    });

    return NextResponse.json({ id: tx.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/transactions failed", e);
    return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 });
  }
}
