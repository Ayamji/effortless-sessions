export interface Session {
  id: string;
  title: string;
  category: SessionCategory;
  duration: number; // in minutes
  actualDuration?: number; // in minutes (for completed sessions)
  status: 'completed' | 'paused' | 'stopped';
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
}

export type SessionCategory = 'Study' | 'Work' | 'Fitness' | 'Custom';

export interface SessionStats {
  totalSessions: number;
  totalTime: number; // in minutes
  categoryBreakdown: Record<SessionCategory, number>;
  weeklyTime: number;
  monthlyTime: number;
  avgSessionLength: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
}

// Supabase types for rooms
export interface Room {
  id: string;
  name: string;
  description?: string;
  category: SessionCategory;
  creator_id: string;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  session_title?: string;
  session_duration?: number;
  joined_at: string;
  is_active: boolean;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomSession {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  category: SessionCategory;
  duration: number;
  actual_duration?: number;
  status: 'completed' | 'paused' | 'stopped';
  start_time: string;
  end_time?: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}