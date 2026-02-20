import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

// ONE-TIME schema migration - delete after use
export async function POST() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== "stephen.parton@gmail.com"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Check current column type
    const colInfo = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bottles' AND column_name = 'user_id'
    `;

    const currentType = colInfo[0]?.data_type;

    if (currentType === "uuid") {
      // Need to convert to text
      await sql`ALTER TABLE bottles ALTER COLUMN user_id TYPE TEXT`;
      await sql`ALTER TABLE inventory_events ALTER COLUMN user_id TYPE TEXT`;
      return NextResponse.json({
        success: true,
        message: "Columns converted from UUID to TEXT",
        previousType: currentType,
      });
    }

    return NextResponse.json({
      success: true,
      message: "No change needed",
      currentType,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
