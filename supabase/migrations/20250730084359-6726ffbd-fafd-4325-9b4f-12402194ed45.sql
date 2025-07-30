-- Add payment_id column to user_purchases table to track Square payments
ALTER TABLE public.user_purchases 
ADD COLUMN payment_id TEXT;