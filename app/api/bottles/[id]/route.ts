import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { BottleUpdate } from "@/lib/database.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const bottles = await sql`
      SELECT * FROM bottles
      WHERE id = ${id}
      AND user_id = ${session.user.id}
    `;

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({ success: false, error: "Bottle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, bottle: bottles[0] });
  } catch (error) {
    console.error("Get bottle error:", error);
    return NextResponse.json(
      { error: "Failed to get bottle" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const updates: any = await request.json();

    // First get the current bottle to compare quantity
    const current = await sql`
      SELECT quantity FROM bottles
      WHERE id = ${id}
      AND user_id = ${session.user.id}
    `;

    if (!current || current.length === 0) {
      return NextResponse.json({ success: false, error: "Bottle not found" }, { status: 404 });
    }

    // Update the bottle with all provided fields
    const updated = await sql`
      UPDATE bottles
      SET
        brand = COALESCE(${updates.brand ?? null}, brand),
        product_name = COALESCE(${updates.product_name ?? null}, product_name),
        category = COALESCE(${updates.category ?? null}, category),
        sub_category = COALESCE(${updates.sub_category ?? null}, sub_category),
        country_of_origin = COALESCE(${updates.country_of_origin ?? null}, country_of_origin),
        region = COALESCE(${updates.region ?? null}, region),
        abv = COALESCE(${updates.abv ?? null}, abv),
        size_ml = COALESCE(${updates.size_ml ?? null}, size_ml),
        description = COALESCE(${updates.description ?? null}, description),
        tasting_notes = COALESCE(${updates.tasting_notes ?? null}, tasting_notes),
        notes = COALESCE(${updates.notes ?? null}, notes),
        dan_murphys_url = COALESCE(${updates.dan_murphys_url ?? null}, dan_murphys_url),
        quantity = ${updates.quantity !== undefined ? updates.quantity : current[0].quantity},
        updated_at = NOW()
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json({ success: false, error: "Bottle not found" }, { status: 404 });
    }

    // If quantity was changed and event_type provided, log inventory event
    if (updates.quantity !== undefined && updates.event_type) {
      await sql`
        INSERT INTO inventory_events (
          user_id, bottle_id, event_type, quantity_change
        )
        VALUES (
          ${session.user.id},
          ${id},
          ${updates.event_type},
          ${updates.quantity_change || 0}
        )
      `;
    }

    return NextResponse.json({ success: true, bottle: updated[0] });
  } catch (error) {
    console.error("Update bottle error:", error);
    return NextResponse.json(
      { error: "Failed to update bottle" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await sql`
      DELETE FROM bottles
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bottle error:", error);
    return NextResponse.json(
      { error: "Failed to delete bottle" },
      { status: 500 }
    );
  }
}
