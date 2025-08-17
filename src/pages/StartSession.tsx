import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimerDisplay } from '@/components/TimerDisplay';
import { SessionStorage } from '@/lib/storage';
import { Session, SessionCategory, TimerState } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { ArrowLeft, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StartSession() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SessionCategory>('Study');
  const [duration, setDuration] = useState(25); // default 25 minutes
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    timeRemaining: 25 * 60, // in seconds
    totalTime: 25 * 60
  });
  
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = SessionStorage.getCurrentSession();
    if (existingSession) {
      setCurrentSession(existingSession);
      setTitle(existingSession.title);
      setCategory(existingSession.category);
      setDuration(existingSession.duration);
      setSessionStarted(true);
      
      // Calculate remaining time
      const elapsed = Math.floor((Date.now() - existingSession.startTime.getTime()) / 1000);
      const remaining = Math.max(0, existingSession.duration * 60 - elapsed);
      
      setTimerState({
        isRunning: false,
        isPaused: true,
        timeRemaining: remaining,
        totalTime: existingSession.duration * 60
      });
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    }

    // Session completed
    if (timerState.timeRemaining === 0 && currentSession) {
      completeSession();
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeRemaining, currentSession]);

  const startSession = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a session title",
        variant: "destructive"
      });
      return;
    }

    const session: Session = {
      id: generateId(),
      title: title.trim(),
      category,
      duration,
      status: 'paused',
      startTime: new Date(),
      createdAt: new Date()
    };

    setCurrentSession(session);
    SessionStorage.setCurrentSession(session);
    setSessionStarted(true);
    
    setTimerState({
      isRunning: false,
      isPaused: true,
      timeRemaining: duration * 60,
      totalTime: duration * 60
    });

    toast({
      title: "Session created",
      description: "Click play to start your timer"
    });
  };

  const playPause = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      isPaused: !prev.isRunning
    }));
  };

  const stopSession = () => {
    if (currentSession) {
      const actualDuration = Math.floor((timerState.totalTime - timerState.timeRemaining) / 60);
      const updatedSession: Session = {
        ...currentSession,
        status: 'stopped',
        actualDuration,
        endTime: new Date()
      };
      
      SessionStorage.saveSession(updatedSession);
      SessionStorage.setCurrentSession(null);
      
      toast({
        title: "Session stopped",
        description: `Session saved with ${actualDuration} minutes`
      });
      
      resetSession();
    }
  };

  const completeSession = () => {
    if (currentSession) {
      const updatedSession: Session = {
        ...currentSession,
        status: 'completed',
        actualDuration: currentSession.duration,
        endTime: new Date()
      };
      
      SessionStorage.saveSession(updatedSession);
      SessionStorage.setCurrentSession(null);
      
      toast({
        title: "🎉 Session completed!",
        description: `Great job! You completed ${currentSession.duration} minutes of ${currentSession.title}`
      });
      
      resetSession();
    }
  };

  const resetSession = () => {
    setCurrentSession(null);
    setSessionStarted(false);
    setTitle('');
    setDuration(25);
    setTimerState({
      isRunning: false,
      isPaused: false,
      timeRemaining: 25 * 60,
      totalTime: 25 * 60
    });
  };

  if (sessionStarted) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground">{category} Session</p>
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>

          <Card className="gradient-card shadow-card border-border">
            <CardContent className="p-8">
              <TimerDisplay
                timeRemaining={timerState.timeRemaining}
                totalTime={timerState.totalTime}
                isRunning={timerState.isRunning}
                isPaused={timerState.isPaused}
              />

              <div className="flex justify-center gap-4 mt-8">
                <Button
                  variant={timerState.isRunning ? "outline" : "timer"}
                  size="lg"
                  onClick={playPause}
                  className="px-8"
                >
                  {timerState.isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {timerState.isPaused ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopSession}
                  className="px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={resetSession}
                  className="px-8"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Start New Session</h1>
        </div>

        <Card className="gradient-card shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-foreground">Session Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Study, Morning Workout, Deep Work"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={(value: SessionCategory) => setCategory(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Study">📚 Study</SelectItem>
                  <SelectItem value="Work">💼 Work</SelectItem>
                  <SelectItem value="Fitness">💪 Fitness</SelectItem>
                  <SelectItem value="Custom">⚡ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration" className="text-foreground">Duration (minutes)</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[15, 25, 45, 60].map((mins) => (
                  <Button
                    key={mins}
                    variant={duration === mins ? "default" : "outline"}
                    onClick={() => setDuration(mins)}
                    className="h-12"
                  >
                    {mins}m
                  </Button>
                ))}
              </div>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="240"
                className="mt-2"
              />
            </div>

            <Button
              variant="gradient"
              size="lg"
              onClick={startSession}
              className="w-full"
            >
              Create Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}