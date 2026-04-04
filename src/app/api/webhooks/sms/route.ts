import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to determine amount and type from bank SMS texts
function parseBankMessage(msg: string, sender: string = "") {
  const lowerMsg = msg.toLowerCase();
  const upperSender = sender.toUpperCase();

  // Is it a credit or debit?
  const isCredit = lowerMsg.includes('credited') || lowerMsg.includes('deposited') || 
                   lowerMsg.includes('credit') || lowerMsg.includes('added') ||
                   lowerMsg.includes('received');
  const isDebit = lowerMsg.includes('debited') || lowerMsg.includes('spent') || 
                  lowerMsg.includes('paid') || lowerMsg.includes('withdrawn') ||
                  lowerMsg.includes('debit') || lowerMsg.includes('purchase') ||
                  lowerMsg.includes('payment of') || lowerMsg.includes('used at');

  // For known bank senders, if neither keyword found, default to debit (most common)
  const isKnownBank = upperSender.includes('BOBSMS') || upperSender.includes('HDFCBK') || 
                      upperSender.includes('ICICIB') || upperSender.includes('SBMSMS') ||
                      upperSender.includes('AXISBK') || upperSender.includes('KOTAKB');

  if (!isCredit && !isDebit && !isKnownBank) return null;

  // Extract amount — handles Rs.500, Rs 500, INR 1,000.00, INR500, ₹500
  const amountMatch = 
    msg.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    msg.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹)/i) ||
    msg.match(/(?:amount|amt)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // For known bank senders without explicit keyword, default to debit
  const type = isCredit ? 'credit' : 'debit';

  return { type, amount };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sender, message, token, userId } = body;

    if (!sender || !message || !token || !userId) {
      return NextResponse.json({ error: "Missing required payload fields." }, { status: 400 });
    }

    // Step 1: Parse the bank SMS text
    const parsed = parseBankMessage(message, sender);
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
      description: `Bank SMS: ${sender}`,
      notes: message,
      amount: parsed.amount,
      type: parsed.type,
      date: new Date().toISOString().split('T')[0],
      category_id: assignedCategoryId ?? null,
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
