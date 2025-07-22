
-- Add video-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN video_urls TEXT[] DEFAULT '{}',
ADD COLUMN video_price DECIMAL(10,2) DEFAULT 9.99,
ADD COLUMN video_package_price DECIMAL(10,2) DEFAULT 39.99;

-- Update payments table to support video purchases
ALTER TABLE public.payments
ADD COLUMN video_id TEXT;

-- Update purchase_type to include video options
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_purchase_type_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_purchase_type_check 
CHECK (purchase_type IN ('photo', 'package', 'video', 'video_package'));

-- Create a table to track individual video unlocks
CREATE TABLE public.video_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_index INTEGER NOT NULL, -- index of video in the profile's video array
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for video_unlocks
ALTER TABLE public.video_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own video unlocks
CREATE POLICY "Users can view own video unlocks" 
ON public.video_unlocks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow inserting video unlocks
CREATE POLICY "Users can create video unlocks" 
ON public.video_unlocks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
