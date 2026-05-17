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
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    // The AI SDK accepts a full data URL directly
    const dataUrl = image.includes("data:") ? image : `data:image/jpeg;base64,${image}`;

    const result = await generateText({
      model: google("gemini-2.0-flash"),
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
              text: `You are a receipt/bill OCR assistant for an Indian personal finance tracker called Xylem Finance.

Analyze this receipt or bill image and extract the following information. Return ONLY a valid JSON object with these fields:

{
  "amount": <number — the total amount paid, as a plain number without currency symbols>,
  "description": "<string — a short, clean description like 'Dinner at Pizza Hut' or 'Grocery shopping at DMart'>",
  "date": "<string — the date in YYYY-MM-DD format. If not visible, use today's date: ${new Date().toISOString().split("T")[0]}>",
  "type": "<string — 'debit' for expenses/purchases, 'credit' for refunds/income>",
  "merchant": "<string — the merchant/store name if visible, otherwise empty string>",
  "category_hint": "<string — one of: Food, Groceries, Transport, Shopping, Entertainment, Health, Education, Bills, Travel, Other>"
}

RULES:
- All monetary values should be in Indian Rupees (INR). If the receipt shows a different currency, still extract the number as-is.
- If you cannot confidently extract a field, provide your best guess.
- The description should be human-friendly and concise.
- Return ONLY the JSON object, no markdown, no explanation.`,
            },
          ],
        },
      ],
      temperature: 0.1,
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
    return NextResponse.json(
      { error: error.message || "Failed to process receipt." },
      { status: 500 }
    );
  }
}
