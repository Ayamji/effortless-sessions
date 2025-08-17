import { useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { TimerState, SessionCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

interface TimerDisplayProps {
  timerState: TimerState;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
  onComplete: () => void;
  title: string;
  category: SessionCategory;
}

export function TimerDisplay({ timerState, setTimerState, onComplete, title, category }: TimerDisplayProps) {
  const { timeRemaining, totalTime, isRunning, isPaused } = timerState;

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimerState(prev => {
        if (prev.timeRemaining <= 1) {
          onComplete();
          return { ...prev, isRunning: false, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, setTimerState, onComplete]);

  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const stopTimer = () => {
    setTimerState(prev => ({ 
      ...prev, 
      isRunning: false, 
      isPaused: false, 
      timeRemaining: 0, 
      totalTime: 0 
    }));
  };
  
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const formattedTime = formatTime(timeRemaining);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Session Info */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-text-primary">{title}</h3>
        <p className="text-text-secondary">{category} Session</p>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="112"
            fill="none"
            stroke="hsl(var(--accent) / 0.3)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="112"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={703.71} // 2 * PI * 112
            strokeDashoffset={703.71 - (703.71 * progress) / 100}
            className="transition-all duration-300 ease-out"
            style={{
              filter: isRunning && !isPaused ? 'drop-shadow(0 0 8px hsl(var(--primary)))' : 'none'
            }}
          />
        </svg>
        
        {/* Timer display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold text-text-primary ${isRunning && !isPaused ? 'animate-timer-pulse' : ''}`}>
            {formattedTime}
          </div>
          <div className="text-sm text-text-secondary mt-2">
            {isPaused ? 'Paused' : isRunning ? 'Running' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={toggleTimer}
          variant={isPaused ? "default" : "outline"}
          size="lg"
          className="min-w-[120px]"
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          )}
        </Button>
        <Button
          onClick={stopTimer}
          variant="destructive"
          size="lg"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="w-full bg-accent/30 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-text-secondary mt-2">
          <span>{formatTime(totalTime - timeRemaining)} elapsed</span>
          <span>{formatTime(totalTime)} total</span>
        </div>
      </div>
    </div>
  );
}