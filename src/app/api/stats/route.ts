import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use the anon key (public) — the RPC function handles access safely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.rpc("get_user_count");

    if (error) throw error;

    return NextResponse.json(
      { count: data ?? 0 },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
