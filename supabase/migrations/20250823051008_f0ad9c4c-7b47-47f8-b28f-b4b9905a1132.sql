-- Fix infinite recursion in room_participants RLS policies
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Users can view participants in their rooms only" ON public.room_participants;

-- Create simpler, non-recursive policies
-- Allow users to see their own participation records
CREATE POLICY "Users can view their own participation" 
ON public.room_participants 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to see participants in rooms where they are the creator
CREATE POLICY "Room creators can view all participants in their rooms" 
ON public.room_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.rooms r 
  WHERE r.id = room_participants.room_id 
  AND r.creator_id = auth.uid()
));

-- Allow users to see other participants in rooms they've joined (non-recursive)
CREATE POLICY "Users can view participants in joined rooms" 
ON public.room_participants 
FOR SELECT 
USING (
  room_id IN (
    SELECT DISTINCT rp.room_id 
    FROM public.room_participants rp 
    WHERE rp.user_id = auth.uid() 
    AND rp.is_active = true
  )
);