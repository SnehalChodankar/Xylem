import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
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

    const { messages, financialContext } = await req.json();

    if (!financialContext || financialContext === "{}" || financialContext === "[]") {
      console.warn("AI Chat API received empty financial context!");
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are Xylem AI, an elite personal finance assistant integrated directly into the user's dashboard.
Your tone should be analytical, encouraging, and highly precise. Do NOT give boilerplate financial advice; use their actual data.

You have been provided with a highly accurate, real-time snapshot of their financial state inside the <FINANCIAL_CONTEXT> XML tags.

<FINANCIAL_CONTEXT>
${financialContext}
</FINANCIAL_CONTEXT>

CRITICAL RULES:
1. When discussing account balances, clearly distinguish between "Live Balance" and "Free Spendable Funds" (money not allocated to goals).
2. If asked about spending trends, rely exclusively on the 'recent_transactions' data.
3. If asked about budgets, compare their spending against the 'current_month_budgets' limits.
4. Use standard markdown formatting (tables, bullet points, bolding) to make your response highly scannable and beautiful.
5. You MUST format monetary values in Indian Rupees (₹) specifically formatted with commas (e.g., ₹1,50,000).
    `;

    const result = streamText({
      model: google("gemini-flash-latest"),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content || (m.parts ? m.parts.map((p: any) => p.text || p.reasoning).join("\n") : ""),
      })),
      temperature: 0.3,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("AI Route Error:", error);
    const errorMessage = error.message || "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
