import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Decrement quantity by 1 (or set to 0 if already 0)
    const updated = await sql`
      UPDATE bottles
      SET
        quantity = GREATEST(quantity - 1, 0),
        updated_at = NOW()
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    // Create finished event
    await sql`
      INSERT INTO inventory_events (
        user_id, bottle_id, event_type, quantity_change
      )
      VALUES (
        ${session.user.id},
        ${id},
        'finished',
        -1
      )
    `;

    return NextResponse.json({ success: true, bottle: updated[0] });
  } catch (error) {
    console.error("Finish bottle error:", error);
    return NextResponse.json(
      { error: "Failed to finish bottle" },
      { status: 500 }
    );
  }
}
