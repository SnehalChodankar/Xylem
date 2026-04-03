-- ====================================================================================
-- ⚡ XYLEM FINANCE: RECURRING TRANSACTIONS & NOTIFICATIONS ENGINE
--
-- Instructions:
-- 1. Open your Supabase Dashboard
-- 2. Go to the "SQL Editor" on the left panel
-- 3. Paste this entire file into a new query and click "RUN"
-- ====================================================================================

-- 0. Ensure the core recurring_transactions table exists!
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    account_id UUID NOT NULL,
    category_id UUID NOT NULL,
    type text NOT NULL CHECK (type IN ('debit', 'credit')),
    amount numeric NOT NULL,
    description text NOT NULL,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own recurring records" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id);

-- 1. Ensure the GLOBAL NOTIFICATIONS table exists!
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('success', 'warning', 'info', 'error')),
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- 2. Explicitly enable the pg_cron extension
create extension if not exists pg_cron;

-- 3. Safely clear any older testing versions of this cron job
-- select cron.unschedule('xylem_billing_cycle_engine');

-- 4. Schedule the main engine to fire daily at 00:00 (Midnight UTC)
select cron.schedule(
  'xylem_billing_cycle_engine',
  '0 0 * * *',
  $$
    -- ==========================================================
    -- PHASE A: INJECT DUE TRANSACTIONS INTO MAINFRAME LEDGER
    -- ==========================================================
    INSERT INTO public.transactions (
      user_id, account_id, category_id, type, amount, description, date, payment_method, notes, is_recurring, recurring_id
    )
    SELECT 
      user_id, account_id, category_id, type, amount, description, next_date, 'Automated', 'Xylem Recurring Subscriptions Engine Generated', true, id
    FROM public.recurring_transactions
    WHERE next_date <= current_date AND is_active = true AND (end_date IS NULL OR next_date <= end_date);

    -- ==========================================================
    -- PHASE B: GENERATE SUCCESS NOTIFICATIONS 
    -- ==========================================================
    INSERT INTO public.notifications (
      user_id, title, message, type, action_url
    )
    SELECT 
      user_id, 
      'Automated Payment Processed', 
      'Successfully processed ₹' || amount || ' for ' || description, 
      'success', 
      '/dashboard/subscriptions'
    FROM public.recurring_transactions
    WHERE next_date <= current_date AND is_active = true AND (end_date IS NULL OR next_date <= end_date);

    -- ==========================================================
    -- PHASE C: CALIBRATE THE NEXT BILLING CYCLE DATE
    -- ==========================================================
    UPDATE public.recurring_transactions
    SET next_date = 
      CASE 
        WHEN frequency = 'daily' THEN next_date + interval '1 day'
        WHEN frequency = 'weekly' THEN next_date + interval '1 week'
        WHEN frequency = 'monthly' THEN next_date + interval '1 month'
        WHEN frequency = 'yearly' THEN next_date + interval '1 year'
      END
    WHERE next_date <= current_date AND is_active = true AND (end_date IS NULL OR next_date <= end_date);

    -- ==========================================================
    -- PHASE D: NOTIFICATION CLEANUP (GARBAGE COLLECTION)
    -- ==========================================================
    -- Delete notifications that have been read AND are older than 30 days
    DELETE FROM public.notifications 
    WHERE is_read = true AND created_at < current_date - interval '30 days';
  $$
);
