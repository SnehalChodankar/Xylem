-- SQL Migration: Add Category Rules Table
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE TABLE public.category_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    keyword TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'contains',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

-- Create Policies for authenticated users
CREATE POLICY "Users can insert their own category rules" ON public.category_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own category rules" ON public.category_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own category rules" ON public.category_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own category rules" ON public.category_rules FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create an index to make sorting faster
CREATE INDEX idx_category_rules_user_id ON public.category_rules(user_id);
