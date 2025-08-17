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