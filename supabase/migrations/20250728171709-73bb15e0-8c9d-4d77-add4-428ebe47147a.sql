-- Drop existing complex tables
DROP TABLE IF EXISTS user_purchases CASCADE;
DROP TABLE IF EXISTS purchased_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS item_prices CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing profiles table to recreate with simplified structure
DROP TABLE IF EXISTS profiles CASCADE;

-- Create simplified profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profile_images table for managing multiple images per profile
CREATE TABLE public.profile_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables (public read access for simplicity)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public profiles access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow profile management" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public profile images access" ON public.profile_images FOR SELECT USING (true);
CREATE POLICY "Allow profile image management" ON public.profile_images FOR ALL USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profile_images_profile_id ON public.profile_images(profile_id);
CREATE INDEX idx_profile_images_display_order ON public.profile_images(profile_id, display_order);