import { Session, SessionStats, SessionCategory } from './types';

const STORAGE_KEYS = {
  SESSIONS: 'effortless-sessions',
  CURRENT_SESSION: 'effortless-current-session'
};

export class SessionStorage {
  static getAllSessions(): Session[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!stored) return [];
      const sessions = JSON.parse(stored);
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        createdAt: new Date(session.createdAt)
      }));
    } catch {
      return [];
    }
  }

  static saveSession(session: Session): void {
    try {
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  static deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions();
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  static getCurrentSession(): Session | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!stored) return null;
      const session = JSON.parse(stored);
      return {
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        createdAt: new Date(session.createdAt)
      };
    } catch {
      return null;
    }
  }

  static setCurrentSession(session: Session | null): void {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    } catch (error) {
      console.error('Failed to set current session:', error);
    }
  }

  static getSessionStats(): SessionStats {
    const sessions = this.getAllSessions();
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyTime = completedSessions
      .filter(s => s.startTime >= weekStart)
      .reduce((total, s) => total + (s.actualDuration || 0), 0);

    const monthlyTime = completedSessions
      .filter(s => s.startTime >= monthStart)
      .reduce((total, s) => total + (s.actualDuration || 0), 0);

    const totalTime = completedSessions
      .reduce((total, s) => total + (s.actualDuration || 0), 0);

    const categoryBreakdown: Record<SessionCategory, number> = {
      Study: 0,
      Work: 0,
      Fitness: 0,
      Custom: 0
    };

    completedSessions.forEach(session => {
      categoryBreakdown[session.category] += session.actualDuration || 0;
    });

    return {
      totalSessions: completedSessions.length,
      totalTime,
      categoryBreakdown,
      weeklyTime,
      monthlyTime,
      avgSessionLength: completedSessions.length > 0 ? totalTime / completedSessions.length : 0
    };
  }
}