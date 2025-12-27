import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET single bottle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("bottles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bottle: data });
  } catch (error) {
    console.error("Get bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get bottle" },
      { status: 500 }
    );
  }
}

// PUT update bottle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    const updates = await request.json();
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("bottles")
      .update(updates)
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

    // If quantity was changed, log an inventory event
    if (updates.quantity !== undefined) {
      // We'll determine the event type based on the action
      // This is handled by the frontend passing event_type
      if (updates.event_type) {
        await supabase.from("inventory_events").insert({
          bottle_id: id,
          event_type: updates.event_type,
          quantity_change: updates.quantity_change || 0,
        });
      }
    }

    return NextResponse.json({ success: true, bottle: data });
  } catch (error) {
    console.error("Update bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bottle" },
      { status: 500 }
    );
  }
}

// DELETE bottle (hard delete for mistakes)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    // First delete related inventory events
    await supabase
      .from("inventory_events")
      .delete()
      .eq("bottle_id", id);

    // Then delete the bottle
    const { error } = await supabase
      .from("bottles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bottle" },
      { status: 500 }
    );
  }
}
