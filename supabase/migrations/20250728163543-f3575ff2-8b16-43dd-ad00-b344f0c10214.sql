-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for item types
CREATE TYPE item_type AS ENUM ('photo', 'video');

-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  square_payment_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create item_prices table for individual pricing
CREATE TABLE public.item_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_index integer NOT NULL,
  item_type item_type NOT NULL,
  price_cents integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, item_index, item_type)
);

-- Create purchased_items table
CREATE TABLE public.purchased_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_index integer NOT NULL,
  item_type item_type NOT NULL,
  price_cents integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_purchases view for easy access
CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_index integer NOT NULL,
  item_type item_type NOT NULL,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, item_index, item_type)
);

-- Enable RLS on all tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for item_prices (public read, admin write)
CREATE POLICY "Anyone can view item prices" ON public.item_prices
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can manage prices" ON public.item_prices
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for purchased_items
CREATE POLICY "Users can view items from their payments" ON public.purchased_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payments 
      WHERE payments.id = purchased_items.payment_id 
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create purchased items for their payments" ON public.purchased_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payments 
      WHERE payments.id = purchased_items.payment_id 
      AND payments.user_id = auth.uid()
    )
  );

-- RLS Policies for user_purchases
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_prices_updated_at
  BEFORE UPDATE ON public.item_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_item_prices_profile_id ON public.item_prices(profile_id);
CREATE INDEX idx_purchased_items_payment_id ON public.purchased_items(payment_id);
CREATE INDEX idx_purchased_items_profile_item ON public.purchased_items(profile_id, item_index, item_type);
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX idx_user_purchases_profile_item ON public.user_purchases(profile_id, item_index, item_type);