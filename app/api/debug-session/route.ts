import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ 
      authenticated: false,
      message: "No session found" 
    });
  }

  const userId = session.user.id;
  
  // Count bottles for this user_id
  const bottleCount = await sql`
    SELECT COUNT(*) as count FROM bottles WHERE user_id = ${userId}
  `;

  // Get distinct user_ids in the bottles table
  const allUserIds = await sql`
    SELECT DISTINCT user_id, COUNT(*) as bottle_count 
    FROM bottles 
    GROUP BY user_id
  `;

  return NextResponse.json({
    authenticated: true,
    session_user_id: userId,
    session_email: session.user.email,
    session_name: session.user.name,
    bottles_for_this_id: parseInt(bottleCount[0].count),
    all_user_ids_in_db: allUserIds,
  });
}
