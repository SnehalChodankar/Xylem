import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseBankMessage(msg: string, sender: string = "") {
  const lowerMsg = msg.toLowerCase();
  const upperSender = sender.toUpperCase();

  const isCredit = lowerMsg.includes('credited') || lowerMsg.includes('deposited') ||
                   lowerMsg.includes('credit') || lowerMsg.includes('added') ||
                   lowerMsg.includes('received');
  const isDebit = lowerMsg.includes('debited') || lowerMsg.includes('spent') ||
                  lowerMsg.includes('paid') || lowerMsg.includes('withdrawn') ||
                  lowerMsg.includes('debit') || lowerMsg.includes('purchase') ||
                  lowerMsg.includes('payment of') || lowerMsg.includes('used at');

  // For known bank sender patterns, default to debit if no keyword matches
  const isKnownBank = upperSender.includes('SMS') || upperSender.includes('BNK') ||
                      upperSender.includes('BK') || upperSender.includes('BANK');

  if (!isCredit && !isDebit && !isKnownBank) return null;

  const amountMatch =
    msg.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    msg.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹)/i) ||
    msg.match(/(?:amount|amt)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  const type = isCredit ? 'credit' : 'debit';
  return { type, amount };
}

// Generate a human-readable description from the SMS body
function generateDescription(msg: string, type: string): string {
  // Try to extract merchant name or purpose from common patterns
  const merchantMatch =
    msg.match(/(?:at|to|for|towards)\s+([A-Za-z0-9\s&'-]{3,30}?)(?:\s+on|\s+via|\s+ref|\.|,|$)/i);
  if (merchantMatch) {
    const merchant = merchantMatch[1].trim();
    if (merchant.length > 2) {
      return type === 'debit' ? `Payment to ${merchant}` : `Received from ${merchant}`;
    }
  }
  return type === 'debit' ? 'Bank Debit' : 'Bank Credit';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sender, message, token, userId } = body;

    if (!sender || !message || !token || !userId) {
      return NextResponse.json({ error: "Missing required payload fields." }, { status: 400 });
    }

    const parsed = parseBankMessage(message, sender);
    if (!parsed) {
      return NextResponse.json({ status: "ignored_non_transaction" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Auto-assign account via sender mappings
    const { data: mappings } = await supabase
      .from('sms_sender_mappings')
      .select('*')
      .eq('user_id', userId);

    let assignedAccountId: string | null = null;
    if (mappings) {
      const upperSender = sender.toUpperCase();
      const match = mappings.find((m: any) =>
        upperSender.includes(m.sender_pattern.toUpperCase())
      );
      if (match) assignedAccountId = match.account_id;
    }

    // Auto-assign category via keyword rules
    const { data: rules } = await supabase
      .from('category_rules')
      .select('*')
      .eq('user_id', userId);

    let assignedCategoryId: string | null = null;
    if (rules) {
      const lowerMessage = message.toLowerCase();
      for (const rule of rules) {
        if (lowerMessage.includes(rule.keyword.toLowerCase())) {
          assignedCategoryId = rule.category_id;
          break;
        }
      }
    }

    const description = generateDescription(message, parsed.type);

    // Insert into sms_transactions staging table (NOT transactions directly)
    const { data, error } = await supabase.from('sms_transactions').insert({
      user_id: userId,
      sender,
      raw_message: message,
      amount: parsed.amount,
      type: parsed.type,
      description,
      account_id: assignedAccountId,
      category_id: assignedCategoryId,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    }).select();

    if (error) {
      console.error("Supabase SMS staging insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", data });

  } catch (err: any) {
    console.error("Webhook exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
