-- Add locked_images and locked_videos arrays to profiles table to track which images/videos are locked
ALTER TABLE public.profiles 
ADD COLUMN locked_images boolean[] DEFAULT '{}',
ADD COLUMN locked_videos boolean[] DEFAULT '{}';

-- Create a function to check if user is admin (using localStorage admin auth for now)
-- This will be used in RLS policies if needed
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, we'll handle admin checks in the application layer
  -- This function is a placeholder for potential future admin role implementation
  RETURN false;
END;
$$;