import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to determine amount and type from generic SMS texts
function parseBankMessage(msg: string) {
  const lowerMsg = msg.toLowerCase();
  
  // Is it a credit or debit?
  const isCredit = lowerMsg.includes('credited') || lowerMsg.includes('deposited') || lowerMsg.includes('added');
  const isDebit = lowerMsg.includes('debited') || lowerMsg.includes('spent') || lowerMsg.includes('paid') || lowerMsg.includes('withdrawn');
  
  if (!isCredit && !isDebit) return null;

  // Extract amount using Regex (INR / Rs. / Amount standard formats)
  const amountMatch = msg.match(/(?:(?:RS|INR|Rs\.?)\s*?)([0-9,]+(?:\.[0-9]{1,2})?)/i) || 
                      msg.match(/([0-9,]+(?:\.[0-9]{1,2})?)(?:\s*?)(?:RS|INR)/i);
  
  if (!amountMatch) return null;
  
  const amountStr = amountMatch[1].replace(/,/g, '');
  const amount = parseFloat(amountStr);

  return { type: isDebit ? 'debit' : 'credit', amount };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sender, message, token, userId } = body;

    if (!sender || !message || !token || !userId) {
      return NextResponse.json({ error: "Missing required payload fields." }, { status: 400 });
    }

    // Step 1: Parse the generic bank text
    const parsed = parseBankMessage(message);
    if (!parsed) {
      // Ignored - Not a transactional message
      return NextResponse.json({ status: "ignored_non_transaction" });
    }

    // Step 2: Initialize Supabase explicitly binding the User's JWT to bypass RLS failures cleanly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Step 3: Fetch Rules Engine to Auto-Categorize
    const { data: rules } = await supabase.from('category_rules').select('*').eq('user_id', userId);
    
    let assignedCategoryId = undefined;

    if (rules) {
      const lowerMessage = message.toLowerCase();
      for (const rule of rules) {
        if (lowerMessage.includes(rule.keyword.toLowerCase())) {
          assignedCategoryId = rule.category_id;
          break;
        }
      }
    }

    // Step 4: Inject directly into Transactions core
    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId,
      description: `SMS: ${sender}`, // Extracted description
      notes: message, // Save full text in notes for auditing
      amount: parsed.amount,
      type: parsed.type,
      date: new Date().toISOString().split('T')[0],
      category_id: assignedCategoryId,
      import_source: "sms_tracking"
    }).select();

    if (error) {
      console.error("Supabase SMS Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", data });

  } catch (err: any) {
    console.error("Webhook exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
