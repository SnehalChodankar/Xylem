import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── Regex Fallback Parser ───────────────────────────────────────────
// Extracts structured data from raw OCR text when Gemini is unavailable
function regexParse(ocrText: string) {
  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract amount — look for total/grand total/amount patterns, or ₹/Rs followed by numbers
  let amount = 0;
  const amountPatterns = [
    /(?:grand\s*total|total\s*(?:amount)?|net\s*(?:amount|payable)|amount\s*(?:due|payable))\s*[:\-]?\s*[₹Rs.INR\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /[₹]\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
    /(?:Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:total|amt)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];
  // Scan lines in reverse (totals are usually at the bottom)
  for (const line of [...lines].reverse()) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
        if (amount > 0) break;
      }
    }
    if (amount > 0) break;
  }

  // Extract date
  let date = new Date().toISOString().split("T")[0];
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i, // 23 May 2026
  ];
  for (const line of lines) {
    for (let i = 0; i < datePatterns.length; i++) {
      const match = line.match(datePatterns[i]);
      if (match) {
        if (i === 0) {
          // DD/MM/YYYY
          const d = match[1].padStart(2, "0");
          const m = match[2].padStart(2, "0");
          date = `${match[3]}-${m}-${d}`;
        } else if (i === 1) {
          // YYYY-MM-DD
          date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
        } else if (i === 2) {
          // 23 May 2026
          const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
          const m = months[match[2].toLowerCase().substring(0, 3)] || "01";
          date = `${match[3]}-${m}-${match[1].padStart(2, "0")}`;
        }
        break;
      }
    }
    if (date !== new Date().toISOString().split("T")[0]) break;
  }

  // Merchant — usually the first meaningful line (skip short/numeric lines)
  let merchant = "";
  for (const line of lines) {
    if (line.length > 3 && !/^[\d\s\-\/:.₹Rs]+$/.test(line)) {
      merchant = line.substring(0, 60);
      break;
    }
  }

  // Category hint based on keywords
  let category_hint = "Other";
  const lowerText = ocrText.toLowerCase();
  if (/restaurant|cafe|hotel|food|biryani|pizza|burger|swiggy|zomato|dine/i.test(lowerText)) category_hint = "Food";
  else if (/grocery|grocer|dmart|bigbasket|reliance fresh|supermarket|kirana/i.test(lowerText)) category_hint = "Groceries";
  else if (/uber|ola|rapido|metro|bus|petrol|diesel|fuel|parking/i.test(lowerText)) category_hint = "Transport";
  else if (/amazon|flipkart|myntra|ajio|shopping|mall|store/i.test(lowerText)) category_hint = "Shopping";
  else if (/movie|pvr|inox|netflix|spotify|entertainment|game/i.test(lowerText)) category_hint = "Entertainment";
  else if (/hospital|clinic|pharmacy|medical|doctor|apollo|health/i.test(lowerText)) category_hint = "Health";
  else if (/electricity|water|gas|internet|jio|airtel|broadband|bill|recharge/i.test(lowerText)) category_hint = "Bills";
  else if (/school|college|tuition|course|udemy|education|book/i.test(lowerText)) category_hint = "Education";
  else if (/flight|train|hotel|booking|travel|irctc|makemytrip/i.test(lowerText)) category_hint = "Travel";

  return {
    amount,
    description: merchant ? `Purchase at ${merchant}` : "Scanned receipt",
    date,
    type: "debit" as const,
    merchant,
    category_hint,
  };
}

// ── Main Route ──────────────────────────────────────────────────────
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

    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!visionApiKey) {
      return NextResponse.json(
        { error: "Vision API key is not configured." },
        { status: 500 }
      );
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    // ── Step 1: Google Cloud Vision API — Image to Text ─────────────
    const base64Content = image.includes(",") ? image.split(",")[1] : image;

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Content },
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errBody = await visionResponse.text();
      console.error("Vision API HTTP Error:", visionResponse.status, errBody);
      return NextResponse.json(
        { error: `Vision API error (${visionResponse.status}). Check your API key and billing.` },
        { status: visionResponse.status }
      );
    }

    const visionData = await visionResponse.json();
    const ocrText =
      visionData?.responses?.[0]?.fullTextAnnotation?.text ||
      visionData?.responses?.[0]?.textAnnotations?.[0]?.description ||
      "";

    if (!ocrText || ocrText.trim().length < 3) {
      return NextResponse.json(
        { error: "Could not read any text from the image. Try a clearer photo." },
        { status: 400 }
      );
    }

    // ── Step 2: Try Gemini text-only parsing (cheap, ~50 tokens) ────
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey) {
      try {
        const result = await generateText({
          model: google("gemini-2.0-flash-lite"),
          messages: [
            {
              role: "user",
              content: `Parse this receipt OCR text into JSON. Return ONLY valid JSON:\n{"amount":<number>,"description":"<what was purchased at merchant>","date":"<YYYY-MM-DD>","type":"debit","merchant":"<store name>","category_hint":"<Food|Groceries|Transport|Shopping|Entertainment|Health|Education|Bills|Travel|Other>"}\n\nOCR Text:\n${ocrText.substring(0, 1500)}`,
            },
          ],
          temperature: 0,
        });

        const responseText = result.text.trim();
        const jsonStr = responseText.startsWith("```")
          ? responseText.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
          : responseText;

        const parsed = JSON.parse(jsonStr);
        return NextResponse.json({ data: parsed, source: "vision+gemini" });
      } catch (geminiErr: any) {
        console.warn("Gemini parsing failed, falling back to regex:", geminiErr.message);
        // Fall through to regex
      }
    }

    // ── Step 3: Regex fallback — always works, no API needed ────────
    const parsed = regexParse(ocrText);
    return NextResponse.json({ data: parsed, source: "vision+regex" });

  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process receipt." },
      { status: 500 }
    );
  }
}
