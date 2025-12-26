import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { BottleInsert } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const bottle: BottleInsert = await request.json();

    const { data, error } = await supabase
      .from("bottles")
      .insert(bottle)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Also create an inventory event
    await supabase.from("inventory_events").insert({
      bottle_id: data.id,
      event_type: "added",
      quantity_change: 1,
    });

    return NextResponse.json({ success: true, bottle: data });
  } catch (error) {
    console.error("Add bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add bottle" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("bottles")
      .select("*")
      .gt("quantity", 0)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bottles: data });
  } catch (error) {
    console.error("Get bottles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get bottles" },
      { status: 500 }
    );
  }
}
