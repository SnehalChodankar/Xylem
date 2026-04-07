import { NextResponse } from "next/server";
import { decryptSms } from "@/lib/encryption";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
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

    // Ensure the caller is inherently authenticated. 
    // They are just asking to decrypt a string they theoretically already pulled via Realtime.
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { encryptedData } = await request.json();
    
    if (!encryptedData) {
      return NextResponse.json({ error: "Missing encryptedData" }, { status: 400 });
    }

    const decrypted = decryptSms(encryptedData);

    return NextResponse.json({ decrypted });
  } catch (err: any) {
    console.error("SMS Decrypt API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
