import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

// ONE-TIME migration endpoint - delete after use
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow Steve to run this
  if (session.user.email !== "stephen.parton@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newUserId = session.user.id;

  // The old UUIDs to consolidate
  const oldUserIds = [
    "aae7d4d6-b45c-4342-a03f-5ee17ab6d09f",
    "6df56e85-36db-4090-aeef-5010ab5ac25d",
    "a5939ba8-b410-4509-9dc1-d8753262693b",
  ];

  try {
    let bottlesUpdated = 0;
    let eventsUpdated = 0;

    for (const oldId of oldUserIds) {
      // Use RETURNING id so we can count affected rows
      const bottleResult = await sql`
        UPDATE bottles SET user_id = ${newUserId}
        WHERE user_id = ${oldId}
        RETURNING id
      `;
      const eventResult = await sql`
        UPDATE inventory_events SET user_id = ${newUserId}
        WHERE user_id = ${oldId}
        RETURNING id
      `;
      bottlesUpdated += bottleResult.length;
      eventsUpdated += eventResult.length;
    }

    // Verify
    const verification = await sql`
      SELECT COUNT(*) as count FROM bottles WHERE user_id = ${newUserId}
    `;

    return NextResponse.json({
      success: true,
      newUserId,
      bottlesUpdated,
      eventsUpdated,
      totalBottlesNow: parseInt(verification[0].count),
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}
