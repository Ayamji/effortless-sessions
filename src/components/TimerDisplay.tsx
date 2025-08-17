import { formatTime } from '@/lib/utils';

interface TimerDisplayProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
}

export function TimerDisplay({ timeRemaining, totalTime, isRunning, isPaused }: TimerDisplayProps) {
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;
  const formattedTime = formatTime(timeRemaining);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="112"
            fill="none"
            stroke="hsl(var(--border))"
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
              filter: isRunning ? 'drop-shadow(0 0 8px hsl(var(--primary)))' : 'none'
            }}
          />
        </svg>
        
        {/* Timer display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold text-foreground ${isRunning ? 'animate-timer-pulse' : ''}`}>
            {formattedTime}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {isPaused ? 'Paused' : isRunning ? 'Running' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatTime(totalTime - timeRemaining)} elapsed</span>
          <span>{formatTime(totalTime)} total</span>
        </div>
      </div>
    </div>
  );
}