-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- For now, we'll handle admin checks in the application layer
  -- This function is a placeholder for potential future admin role implementation
  RETURN false;
END;
$$;