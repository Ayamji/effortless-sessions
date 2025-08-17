-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Study', 'Work', 'Fitness', 'Custom')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Rooms are viewable by authenticated users" 
ON public.rooms 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create rooms" 
ON public.rooms 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creators can update their rooms" 
ON public.rooms 
FOR UPDATE 
TO authenticated
USING (auth.uid() = creator_id);

-- Create room participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_title TEXT,
  session_duration INTEGER, -- in minutes
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Room participants policies
CREATE POLICY "Participants can view room participants" 
ON public.room_participants 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp 
    WHERE rp.room_id = room_participants.room_id 
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join rooms" 
ON public.room_participants 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.room_participants 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
ON public.room_participants 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create room sessions table for tracking individual sessions in rooms
CREATE TABLE public.room_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('Study', 'Work', 'Fitness', 'Custom')),
  duration INTEGER NOT NULL, -- in minutes
  actual_duration INTEGER, -- in minutes (for completed sessions)
  status TEXT CHECK (status IN ('completed', 'paused', 'stopped')) DEFAULT 'completed',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_sessions ENABLE ROW LEVEL SECURITY;

-- Room sessions policies
CREATE POLICY "Users can view sessions in rooms they're in" 
ON public.room_sessions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp 
    WHERE rp.room_id = room_sessions.room_id 
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own sessions" 
ON public.room_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for tables
ALTER TABLE public.room_participants REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_sessions;