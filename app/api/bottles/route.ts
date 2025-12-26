import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { BottleInsert } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const bottle: BottleInsert = await request.json();

    // Check if bottle with same brand + product_name already exists
    const { data: existingList } = await supabase
      .from("bottles")
      .select("id, quantity")
      .ilike("brand", bottle.brand)
      .ilike("product_name", bottle.product_name)
      .gt("quantity", 0)
      .limit(1);

    let resultBottle;

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      const currentQty = existing.quantity ?? 1;
      
      // Increment quantity of existing bottle
      const { data, error } = await supabase
        .from("bottles")
        .update({ 
          quantity: currentQty + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      resultBottle = data;
    } else {
      // Create new bottle record
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
      resultBottle = data;
    }

    // Create inventory event
    await supabase.from("inventory_events").insert({
      bottle_id: resultBottle.id,
      event_type: "added" as const,
      quantity_change: 1,
    });

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
