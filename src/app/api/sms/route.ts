import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSms } from "@/lib/encryption";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: smsTransactions, error } = await supabase
      .from("sms_transactions")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch SMS transactions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Decrypt the raw message payload securely on the backend before sending to the client
    const decryptedData = smsTransactions.map((tx) => ({
      ...tx,
      raw_message: decryptSms(tx.raw_message),
    }));

    return NextResponse.json({ data: decryptedData });
  } catch (err: any) {
    console.error("SMS Fetch API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
