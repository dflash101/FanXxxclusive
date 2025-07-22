
-- Add pricing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN photo_price DECIMAL(10,2) DEFAULT 4.99,
ADD COLUMN package_price DECIMAL(10,2) DEFAULT 19.99;

-- Update payments table to track individual photo purchases
ALTER TABLE public.payments
ADD COLUMN photo_id TEXT,
ADD COLUMN purchase_type TEXT DEFAULT 'package'; -- 'photo' or 'package'

-- Create a table to track individual photo unlocks
CREATE TABLE public.photo_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_index INTEGER NOT NULL, -- index of photo in the profile's image array
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for photo_unlocks
ALTER TABLE public.photo_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own photo unlocks
CREATE POLICY "Users can view own photo unlocks" 
ON public.photo_unlocks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow inserting photo unlocks
CREATE POLICY "Users can create photo unlocks" 
ON public.photo_unlocks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
