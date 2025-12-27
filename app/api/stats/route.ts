import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get all active bottles for this user
    const { data: bottles } = await supabase
      .from("bottles")
      .select("quantity, category")
      .eq("user_id", user.id)
      .gt("quantity", 0);

    // Calculate total bottles and unique categories
    const totalBottles = bottles?.reduce((sum, b) => sum + ((b as any).quantity || 0), 0) || 0;
    const categories = new Set(bottles?.map(b => (b as any).category)).size;

    // Get bottles finished this month for this user
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: finishedEvents } = await supabase
      .from("inventory_events")
      .select("quantity_change")
      .eq("user_id", user.id)
      .eq("event_type", "finished")
      .gte("event_date", startOfMonth.toISOString());

    const finishedThisMonth = finishedEvents?.reduce(
      (sum, e) => sum + Math.abs((e as any).quantity_change || 0), 0
    ) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalBottles,
        categories,
        cocktailsAvailable: null, // Future feature
        finishedThisMonth,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
