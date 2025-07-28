-- Create payments table to track all transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- 'square' or 'crypto'
  square_payment_id TEXT, -- Square payment ID for tracking
  crypto_tx_hash TEXT, -- Crypto transaction hash for future use
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  metadata JSONB, -- Additional payment data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_unlocks table to track what users have unlocked
CREATE TABLE public.user_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  unlock_type TEXT NOT NULL, -- 'photos', 'videos', 'profile'
  payment_id UUID REFERENCES public.payments(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, unlock_type)
);

-- Create payment_methods table for configuration
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'square', 'crypto'
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  config JSONB, -- Method-specific configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" 
ON public.payments 
FOR UPDATE 
USING (true);

-- RLS Policies for user_unlocks
CREATE POLICY "Users can view their own unlocks" 
ON public.user_unlocks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view unlocks for profiles" 
ON public.user_unlocks 
FOR SELECT 
USING (true);

CREATE POLICY "System can create unlocks" 
ON public.user_unlocks 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for payment_methods
CREATE POLICY "Everyone can view payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (enabled = true);

-- Create indexes for performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_profile_id ON public.payments(profile_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_square_id ON public.payments(square_payment_id);
CREATE INDEX idx_user_unlocks_user_profile ON public.user_unlocks(user_id, profile_id);
CREATE INDEX idx_user_unlocks_profile ON public.user_unlocks(profile_id);

-- Add updated_at trigger to payments
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, enabled, display_order, config) VALUES
('Credit Card', 'square', true, 1, '{"description": "Pay with credit or debit card"}'),
('Crypto Payment', 'crypto', false, 2, '{"description": "Pay with cryptocurrency (coming soon)", "currencies": ["BTC", "ETH", "USDC"]}');