-- Add foreign key relationship between room_participants and profiles
ALTER TABLE room_participants 
ADD CONSTRAINT fk_room_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- Also add foreign key for room_id to rooms table for better data integrity
ALTER TABLE room_participants 
ADD CONSTRAINT fk_room_participants_room_id 
FOREIGN KEY (room_id) REFERENCES rooms(id);

-- Add foreign key for room_sessions user_id to profiles
ALTER TABLE room_sessions 
ADD CONSTRAINT fk_room_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- Add foreign key for room_sessions room_id to rooms
ALTER TABLE room_sessions 
ADD CONSTRAINT fk_room_sessions_room_id 
FOREIGN KEY (room_id) REFERENCES rooms(id);

-- Add foreign key for rooms creator_id to profiles
ALTER TABLE rooms 
ADD CONSTRAINT fk_rooms_creator_id 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id);