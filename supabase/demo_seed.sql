-- ====================================================================================
-- ⚡ XYLEM FINANCE: DEMO ACCOUNT SEED SCRIPT
--
-- Instructions:
-- 1. First, create a user in Supabase Auth with:
--    Email: demo@xylem.finance  |  Password: demo1234
-- 2. Copy the user UUID from the Supabase Auth dashboard
-- 3. Replace 'DEMO_USER_ID_HERE' below with the actual UUID
-- 4. Run this entire script in the Supabase SQL Editor
-- ====================================================================================

-- Set the demo user ID (REPLACE THIS!)
DO $$ 
DECLARE
  demo_uid UUID := 'ea71d08c-3865-4578-b30b-1dafc3f999c3';
  -- Account IDs
  acc_hdfc UUID := gen_random_uuid();
  acc_cash UUID := gen_random_uuid();
  acc_sbi_cc UUID := gen_random_uuid();
  -- Category IDs
  cat_food UUID := gen_random_uuid();
  cat_groceries UUID := gen_random_uuid();
  cat_transport UUID := gen_random_uuid();
  cat_shopping UUID := gen_random_uuid();
  cat_entertainment UUID := gen_random_uuid();
  cat_health UUID := gen_random_uuid();
  cat_bills UUID := gen_random_uuid();
  cat_education UUID := gen_random_uuid();
  cat_salary UUID := gen_random_uuid();
  cat_freelance UUID := gen_random_uuid();
  cat_rent UUID := gen_random_uuid();
  cat_travel UUID := gen_random_uuid();
BEGIN

-- ============================================
-- ACCOUNTS
-- ============================================
INSERT INTO accounts (id, user_id, name, type, balance, icon, color, is_default) VALUES
  (acc_hdfc, demo_uid, 'HDFC Savings', 'bank', 125000.00, '🏦', '#1e40af', true),
  (acc_cash, demo_uid, 'Cash Wallet', 'cash', 5200.00, '💵', '#16a34a', false),
  (acc_sbi_cc, demo_uid, 'SBI Credit Card', 'credit_card', 0, '💳', '#dc2626', false);

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, user_id, name, icon, color, type, is_system) VALUES
  (cat_food, demo_uid, 'Food & Dining', '🍕', '#f97316', 'expense', true),
  (cat_groceries, demo_uid, 'Groceries', '🛒', '#22c55e', 'expense', true),
  (cat_transport, demo_uid, 'Transport', '🚗', '#3b82f6', 'expense', true),
  (cat_shopping, demo_uid, 'Shopping', '🛍️', '#a855f7', 'expense', true),
  (cat_entertainment, demo_uid, 'Entertainment', '🎬', '#ec4899', 'expense', true),
  (cat_health, demo_uid, 'Health', '💊', '#14b8a6', 'expense', true),
  (cat_bills, demo_uid, 'Bills & Utilities', '📱', '#64748b', 'expense', true),
  (cat_education, demo_uid, 'Education', '📚', '#8b5cf6', 'expense', true),
  (cat_salary, demo_uid, 'Salary', '💰', '#10b981', 'income', true),
  (cat_freelance, demo_uid, 'Freelance', '💻', '#06b6d4', 'income', true),
  (cat_rent, demo_uid, 'Rent & Housing', '🏠', '#ef4444', 'expense', true),
  (cat_travel, demo_uid, 'Travel', '✈️', '#0ea5e9', 'expense', true);

-- ============================================
-- TRANSACTIONS (Last ~60 days of realistic data)
-- ============================================
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date, payment_method, notes, import_source) VALUES
  -- === THIS MONTH (May 2026) ===
  (demo_uid, acc_hdfc, cat_salary, 'credit', 85000.00, 'Monthly Salary - TCS', CURRENT_DATE - interval '18 days', 'NetBanking', 'May salary credited', 'manual'),
  (demo_uid, acc_hdfc, cat_freelance, 'credit', 12000.00, 'UI Design Project - Dribbble', CURRENT_DATE - interval '10 days', 'UPI', 'Freelance payment', 'manual'),
  (demo_uid, acc_hdfc, cat_rent, 'debit', 22000.00, 'Monthly Rent - Flat 302', CURRENT_DATE - interval '17 days', 'NetBanking', 'May rent payment', 'manual'),
  (demo_uid, acc_hdfc, cat_bills, 'debit', 1499.00, 'Jio Fiber - Internet Bill', CURRENT_DATE - interval '15 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_bills, 'debit', 899.00, 'Electricity Bill - Tata Power', CURRENT_DATE - interval '14 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_sbi_cc, cat_food, 'debit', 456.00, 'Dinner at Barbeque Nation', CURRENT_DATE - interval '2 days', 'Card', 'Birthday dinner', 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 189.00, 'Swiggy - Biryani Order', CURRENT_DATE - interval '1 day', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_food, 'debit', 80.00, 'Street Food - Pani Puri', CURRENT_DATE, 'Cash', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 320.00, 'Zomato - Pizza Delivery', CURRENT_DATE - interval '5 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 150.00, 'Chai & Snacks - Office', CURRENT_DATE - interval '3 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_groceries, 'debit', 3200.00, 'DMart - Monthly Groceries', CURRENT_DATE - interval '12 days', 'UPI', 'Monthly essentials', 'manual'),
  (demo_uid, acc_cash, cat_groceries, 'debit', 450.00, 'Fruits & Vegetables - Local Market', CURRENT_DATE - interval '4 days', 'Cash', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_groceries, 'debit', 890.00, 'BigBasket - Snacks & Beverages', CURRENT_DATE - interval '8 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_transport, 'debit', 250.00, 'Uber - Office Commute', CURRENT_DATE - interval '1 day', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_transport, 'debit', 180.00, 'Rapido Bike - Mall Trip', CURRENT_DATE - interval '6 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_transport, 'debit', 500.00, 'Petrol - Activa', CURRENT_DATE - interval '9 days', 'Cash', NULL, 'manual'),
  (demo_uid, acc_sbi_cc, cat_shopping, 'debit', 2499.00, 'Amazon - Wireless Earbuds', CURRENT_DATE - interval '7 days', 'Card', 'boAt Airdopes', 'manual'),
  (demo_uid, acc_sbi_cc, cat_shopping, 'debit', 1299.00, 'Myntra - T-Shirts', CURRENT_DATE - interval '11 days', 'Card', 'Summer sale', 'manual'),
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 299.00, 'Netflix Subscription', CURRENT_DATE - interval '16 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 499.00, 'Spotify Premium', CURRENT_DATE - interval '16 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_entertainment, 'debit', 700.00, 'Movie - PVR IMAX Tickets', CURRENT_DATE - interval '3 days', 'Cash', 'Watched Pushpa 3', 'manual'),
  (demo_uid, acc_hdfc, cat_health, 'debit', 1500.00, 'Apollo Pharmacy - Medicines', CURRENT_DATE - interval '13 days', 'UPI', 'Monthly vitamins', 'manual'),
  (demo_uid, acc_hdfc, cat_health, 'debit', 800.00, 'Gym Membership - Cult.fit', CURRENT_DATE - interval '16 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_education, 'debit', 4999.00, 'Udemy - React Course', CURRENT_DATE - interval '9 days', 'UPI', 'Advanced patterns course', 'manual'),

  -- === LAST MONTH (April 2026) ===
  (demo_uid, acc_hdfc, cat_salary, 'credit', 85000.00, 'Monthly Salary - TCS', CURRENT_DATE - interval '48 days', 'NetBanking', 'April salary', 'manual'),
  (demo_uid, acc_hdfc, cat_freelance, 'credit', 8000.00, 'Logo Design - Fiverr', CURRENT_DATE - interval '35 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_rent, 'debit', 22000.00, 'Monthly Rent - Flat 302', CURRENT_DATE - interval '47 days', 'NetBanking', 'April rent', 'manual'),
  (demo_uid, acc_hdfc, cat_bills, 'debit', 1499.00, 'Jio Fiber - Internet Bill', CURRENT_DATE - interval '45 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_bills, 'debit', 750.00, 'Electricity Bill - Tata Power', CURRENT_DATE - interval '44 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 580.00, 'Dinner at Mainland China', CURRENT_DATE - interval '30 days', 'UPI', 'Team outing', 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 210.00, 'Swiggy - Thali Combo', CURRENT_DATE - interval '32 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_food, 'debit', 120.00, 'Vada Pav & Chai', CURRENT_DATE - interval '38 days', 'Cash', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_food, 'debit', 350.00, 'Dominos - Pizza Night', CURRENT_DATE - interval '40 days', 'UPI', 'Weekend treat', 'manual'),
  (demo_uid, acc_hdfc, cat_groceries, 'debit', 2800.00, 'Reliance Fresh - Groceries', CURRENT_DATE - interval '42 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_groceries, 'debit', 380.00, 'Sabzi Mandi - Vegetables', CURRENT_DATE - interval '36 days', 'Cash', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_transport, 'debit', 300.00, 'Ola Auto - Airport Drop', CURRENT_DATE - interval '33 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_cash, cat_transport, 'debit', 600.00, 'Petrol - Activa', CURRENT_DATE - interval '39 days', 'Cash', NULL, 'manual'),
  (demo_uid, acc_sbi_cc, cat_shopping, 'debit', 3499.00, 'Flipkart - Backpack + Bottle', CURRENT_DATE - interval '37 days', 'Card', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 299.00, 'Netflix Subscription', CURRENT_DATE - interval '46 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 499.00, 'Spotify Premium', CURRENT_DATE - interval '46 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_hdfc, cat_health, 'debit', 500.00, 'Doctor Visit - ENT', CURRENT_DATE - interval '41 days', 'UPI', 'Seasonal cold', 'manual'),
  (demo_uid, acc_hdfc, cat_health, 'debit', 800.00, 'Gym Membership - Cult.fit', CURRENT_DATE - interval '46 days', 'UPI', NULL, 'manual'),
  (demo_uid, acc_sbi_cc, cat_travel, 'debit', 6500.00, 'IndiGo Flight - Pune to Goa', CURRENT_DATE - interval '34 days', 'Card', 'Weekend trip', 'manual'),
  (demo_uid, acc_cash, cat_travel, 'debit', 2000.00, 'Goa Hotel - 1 Night', CURRENT_DATE - interval '33 days', 'Cash', NULL, 'manual');

-- ============================================
-- BUDGETS (Current month)
-- ============================================
INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES
  (demo_uid, cat_food, 5000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_groceries, 6000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_transport, 3000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_shopping, 5000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_entertainment, 2000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_health, 3000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_bills, 5000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int),
  (demo_uid, cat_rent, 25000, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int);

-- ============================================
-- RECURRING TRANSACTIONS (Subscriptions)
-- ============================================
INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, next_date, is_active) VALUES
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 299.00, 'Netflix Premium', 'monthly', (CURRENT_DATE + interval '1 month')::date, true),
  (demo_uid, acc_hdfc, cat_entertainment, 'debit', 499.00, 'Spotify Family', 'monthly', (CURRENT_DATE + interval '1 month')::date, true),
  (demo_uid, acc_hdfc, cat_bills, 'debit', 1499.00, 'Jio Fiber - 150Mbps', 'monthly', (CURRENT_DATE + interval '1 month')::date, true),
  (demo_uid, acc_hdfc, cat_health, 'debit', 800.00, 'Cult.fit Gym', 'monthly', (CURRENT_DATE + interval '1 month')::date, true);

-- ============================================
-- GOALS
-- ============================================
INSERT INTO goals (user_id, account_id, name, icon, color, target_amount, current_amount, deadline, is_completed) VALUES
  (demo_uid, acc_hdfc, 'Emergency Fund', '🛡️', '#ef4444', 300000, 125000, '2026-12-31', false),
  (demo_uid, acc_hdfc, 'MacBook Pro M4', '💻', '#6366f1', 180000, 45000, '2027-03-01', false),
  (demo_uid, acc_hdfc, 'Goa Trip Fund', '🏖️', '#06b6d4', 25000, 25000, '2026-04-15', true);

-- ============================================
-- NOTIFICATIONS (Sample)
-- ============================================
INSERT INTO notifications (user_id, title, message, type, is_read, action_url) VALUES
  (demo_uid, 'Welcome to Xylem! 🎉', 'This is a demo account loaded with sample data. Explore all the features!', 'info', false, '/dashboard'),
  (demo_uid, 'Automated Payment Processed', 'Successfully processed ₹299 for Netflix Premium', 'success', true, '/dashboard/subscriptions'),
  (demo_uid, 'Approaching Budget Limit', 'You''ve spent ₹4,540 (91%) of your Food & Dining budget.', 'warning', false, '/dashboard/budgets');

RAISE NOTICE 'Demo data seeded successfully for user %', demo_uid;
END $$;
