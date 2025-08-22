-- Add music support to rooms for YouTube lofi/study music sharing
-- Add music_url field to store YouTube video URL for the room
ALTER TABLE public.rooms 
ADD COLUMN music_url TEXT;

-- Add music_title field to store the title of the music/video
ALTER TABLE public.rooms 
ADD COLUMN music_title TEXT;

-- Add updated_by field to track who last updated the music
ALTER TABLE public.rooms 
ADD COLUMN music_updated_by UUID REFERENCES profiles(user_id);

-- Create RLS policy to allow room participants to update music
CREATE POLICY "Room participants can update music" 
ON public.rooms 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM room_participants 
    WHERE room_id = rooms.id AND is_active = true
  )
);