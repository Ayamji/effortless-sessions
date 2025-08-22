-- Fix security vulnerability: Restrict profile data access to authenticated users only
-- This prevents anonymous users from viewing usernames and user IDs

-- Drop the existing overly permissive policy
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create a new secure policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);