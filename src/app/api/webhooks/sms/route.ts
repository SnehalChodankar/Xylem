import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptSms, decryptSms } from "@/lib/encryption";

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
    const authHeader = req.headers.get("Authorization");
    const body = await req.json();
    
    // Support Token from Header OR Body (legacy)
    const token = authHeader ? authHeader.replace("Bearer ", "") : body.token;
    const { messages: batchMessages, sender, message } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
    }

    // Support both batch and legacy single-message payload
    const messagesToProcess = batchMessages || [{ sender, message }];

    if (!messagesToProcess || messagesToProcess.length === 0) {
      return NextResponse.json({ status: "no_messages" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // CRITICAL SECURITY PATCH: Never trust the `userId` from the body payload!
    // Always cryptographically verify the caller's identity via the JWT token.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    
    const userId = user.id;

    // 1. Fetch user rules and mappings for auto-categorization
    const { data: mappings } = await supabase.from('sms_sender_mappings').select('*').eq('user_id', userId);
    const { data: rules } = await supabase.from('category_rules').select('*').eq('user_id', userId);

    // 2. Fetch recent transactions for deduplication (last 50 for this user)
    const { data: recentTxns } = await supabase
      .from('sms_transactions')
      .select('raw_message')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    // Decrypt them so we can compare the raw text
    const recentMessages = new Set((recentTxns || []).map(t => {
      try { return decryptSms(t.raw_message); } catch (e) { return ""; }
    }).filter(Boolean));

    const insertPayload = [];

    // 3. Process each message
    for (const msgObj of messagesToProcess) {
      if (!msgObj || !msgObj.sender || !msgObj.message) continue;
      
      const parsed = parseBankMessage(msgObj.message, msgObj.sender);
      if (!parsed) continue; // Ignore non-transactions safely

      // Deduplication check
      if (recentMessages.has(msgObj.message)) {
        continue; // Skip, already inserted recently
      }

      let assignedAccountId: string | null = null;
      if (mappings) {
        const upperSender = msgObj.sender.toUpperCase();
        const match = mappings.find((m: any) => upperSender.includes(m.sender_pattern.toUpperCase()));
        if (match) assignedAccountId = match.account_id;
      }

      let assignedCategoryId: string | null = null;
      if (rules) {
        const lowerMessage = msgObj.message.toLowerCase();
        for (const rule of rules) {
          if (lowerMessage.includes(rule.keyword.toLowerCase())) {
            assignedCategoryId = rule.category_id;
            break;
          }
        }
      }

      const description = generateDescription(msgObj.message, parsed.type);
      const encryptedMessage = encryptSms(msgObj.message);

      insertPayload.push({
        user_id: userId,
        sender: msgObj.sender,
        raw_message: encryptedMessage,
        amount: parsed.amount,
        type: parsed.type,
        description,
        account_id: assignedAccountId,
        category_id: assignedCategoryId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      });
      
      // Add to set to prevent deduplication against itself within the same batch
      recentMessages.add(msgObj.message);
    }

    if (insertPayload.length === 0) {
      return NextResponse.json({ status: "success", count: 0 });
    }

    // Insert all valid parsed transactions dynamically safely into staging
    const { error } = await supabase.from('sms_transactions').insert(insertPayload);

    if (error) {
      console.error("Supabase SMS batch insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", count: insertPayload.length });

  } catch (err: any) {
    console.error("Webhook exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
