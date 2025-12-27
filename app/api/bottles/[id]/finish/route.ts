import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST - Mark one bottle as finished (decrement quantity)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    // Get current bottle
    const { data: bottle, error: fetchError } = await supabase
      .from("bottles")
      .select("quantity")
      .eq("id", id)
      .single();

    if (fetchError || !bottle) {
      return NextResponse.json(
        { success: false, error: "Bottle not found" },
        { status: 404 }
      );
    }

    const currentQty = (bottle as any).quantity ?? 0;
    
    if (currentQty <= 0) {
      return NextResponse.json(
        { success: false, error: "No bottles left to finish" },
        { status: 400 }
      );
    }

    // Decrement quantity
    const { data, error } = await supabase
      .from("bottles")
      .update({ 
        quantity: currentQty - 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log the finish event for consumption tracking
    await supabase.from("inventory_events").insert({
      bottle_id: id,
      event_type: "finished",
      quantity_change: -1,
    });

    return NextResponse.json({ success: true, bottle: data });
  } catch (error) {
    console.error("Finish bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to finish bottle" },
      { status: 500 }
    );
  }
}
