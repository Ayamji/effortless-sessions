-- Fix security issue: Restrict room_participants visibility to only rooms where user is a participant
DROP POLICY IF EXISTS "Users can view all room participants" ON public.room_participants;

-- Create new restrictive policy
CREATE POLICY "Users can view participants in their rooms only" 
ON public.room_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM room_participants rp2 
    WHERE rp2.room_id = room_participants.room_id 
    AND rp2.user_id = auth.uid()
  )
);