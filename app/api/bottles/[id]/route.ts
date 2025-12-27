import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET single bottle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("bottles")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
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
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const updates = await request.json();
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("bottles")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
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
    if (updates.quantity !== undefined && updates.event_type) {
      await supabase.from("inventory_events").insert({
        bottle_id: id,
        event_type: updates.event_type,
        quantity_change: updates.quantity_change || 0,
        user_id: user.id,
      });
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
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // First delete related inventory events (RLS will ensure user owns them)
    await supabase
      .from("inventory_events")
      .delete()
      .eq("bottle_id", id)
      .eq("user_id", user.id);

    // Then delete the bottle (RLS will ensure user owns it)
    const { error } = await supabase
      .from("bottles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

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
