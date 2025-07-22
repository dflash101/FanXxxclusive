
-- Update the RLS policy to allow profile management without authentication requirement
DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;

-- Create a new policy that allows all operations on profiles table
-- This removes the authentication requirement while keeping RLS enabled
CREATE POLICY "Allow profile management" 
ON public.profiles 
FOR ALL
USING (true)
WITH CHECK (true);
