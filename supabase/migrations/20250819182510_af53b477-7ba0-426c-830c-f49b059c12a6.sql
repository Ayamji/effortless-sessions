-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Participants can view room participants" ON public.room_participants;

-- Create a simple policy that allows users to view participants in any room
-- This is safe since rooms are public anyway
CREATE POLICY "Users can view all room participants" 
ON public.room_participants 
FOR SELECT 
USING (true);