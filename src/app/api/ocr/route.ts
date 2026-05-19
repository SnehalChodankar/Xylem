import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "AI API key is not configured. Contact the admin." },
        { status: 500 }
      );
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    // The AI SDK accepts a full data URL directly
    const dataUrl = image.includes("data:") ? image : `data:image/jpeg;base64,${image}`;

    // Use gemini-2.0-flash-lite for lower token usage and better quota efficiency
    const result = await generateText({
      model: google("gemini-2.0-flash-lite"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: dataUrl,
            },
            {
              type: "text",
              text: `Extract receipt info as JSON: {"amount":<number>,"description":"<short merchant + what was bought>","date":"<YYYY-MM-DD or ${new Date().toISOString().split("T")[0]}>","type":"debit","merchant":"<name>","category_hint":"<Food|Groceries|Transport|Shopping|Entertainment|Health|Education|Bills|Travel|Other>"}. Return ONLY valid JSON, nothing else.`,
            },
          ],
        },
      ],
      temperature: 0,
    });

    // Parse the JSON from Gemini's response
    const responseText = result.text.trim();
    
    // Handle potential markdown code blocks in the response
    const jsonStr = responseText.startsWith("```")
      ? responseText.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
      : responseText;

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({ data: parsed });
  } catch (error: any) {
    console.error("OCR API Error:", error);
    
    const msg = error?.message || "";
    
    // Detect quota/rate limit errors specifically
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Free tier resets daily at ~12:30 PM IST. Try again later or upgrade your API key at ai.google.dev." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: msg || "Failed to process receipt." },
      { status: 500 }
    );
  }
}
