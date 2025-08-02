-- Add price field to profile_images table
ALTER TABLE public.profile_images 
ADD COLUMN price NUMERIC(10,2) NOT NULL DEFAULT 4.99;

-- Add index for better query performance
CREATE INDEX idx_profile_images_price ON public.profile_images(price);