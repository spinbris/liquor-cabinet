import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Total bottles
    const totalResult = await sql`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM bottles
      WHERE user_id = ${userId}
    `;

    // Count of unique categories
    const categoriesResult = await sql`
      SELECT COUNT(DISTINCT category) as count
      FROM bottles
      WHERE user_id = ${userId}
      AND quantity > 0
    `;

    // Finished this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const finishedResult = await sql`
      SELECT COALESCE(SUM(ABS(quantity_change)), 0) as count
      FROM inventory_events
      WHERE user_id = ${userId}
      AND event_type = 'finished'
      AND event_date >= ${startOfMonth.toISOString()}
    `;

    return NextResponse.json({
      success: true,
      stats: {
        totalBottles: parseInt(totalResult[0].total),
        categories: parseInt(categoriesResult[0].count),
        cocktailsAvailable: null,
        finishedThisMonth: parseInt(finishedResult[0].count),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
