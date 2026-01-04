import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { BottleInsert } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const bottle: BottleInsert & { quantity?: number } = await request.json();
    const addQuantity = bottle.quantity || 1;
    const userId = session.user.id;

    // Check if bottle already exists for this user
    const existingList = await sql`
      SELECT id, quantity FROM bottles
      WHERE user_id = ${userId}
      AND LOWER(brand) = LOWER(${bottle.brand})
      AND LOWER(product_name) = LOWER(${bottle.product_name})
      AND quantity > 0
      LIMIT 1
    `;

    let resultBottle;

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      const currentQty = existing.quantity ?? 0;

      // Update existing bottle
      const updated = await sql`
        UPDATE bottles
        SET
          quantity = ${currentQty + addQuantity},
          updated_at = NOW()
        WHERE id = ${existing.id}
        AND user_id = ${userId}
        RETURNING *
      `;
      resultBottle = updated[0];
    } else {
      // Insert new bottle
      const inserted = await sql`
        INSERT INTO bottles (
          user_id, brand, product_name, category, sub_category,
          country_of_origin, region, abv, size_ml, description,
          tasting_notes, image_url, quantity, notes, dan_murphys_url
        )
        VALUES (
          ${userId},
          ${bottle.brand},
          ${bottle.product_name},
          ${bottle.category},
          ${bottle.sub_category || null},
          ${bottle.country_of_origin || null},
          ${bottle.region || null},
          ${bottle.abv || null},
          ${bottle.size_ml || null},
          ${bottle.description || null},
          ${bottle.tasting_notes || null},
          ${bottle.image_url || null},
          ${addQuantity},
          ${bottle.notes || null},
          ${bottle.dan_murphys_url || null}
        )
        RETURNING *
      `;
      resultBottle = inserted[0];
    }

    // Create inventory event
    await sql`
      INSERT INTO inventory_events (
        user_id, bottle_id, event_type, quantity_change
      )
      VALUES (
        ${userId},
        ${resultBottle.id},
        'added',
        ${addQuantity}
      )
    `;

    return NextResponse.json({ success: true, bottle: resultBottle });
  } catch (error) {
    console.error("Add bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add bottle" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const bottles = await sql`
      SELECT * FROM bottles
      WHERE user_id = ${session.user.id}
      AND quantity > 0
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, bottles });
  } catch (error) {
    console.error("Get bottles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get bottles" },
      { status: 500 }
    );
  }
}
