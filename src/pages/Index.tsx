import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SessionStorage } from '@/lib/storage';
import { formatDuration } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Timer, History, TrendingUp, Clock, LogIn, LogOut, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const stats = SessionStorage.getSessionStats();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Auth Status Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Header with animated title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative mb-6">
            <h1 className="text-6xl font-bold text-foreground mb-2 animate-scale-in">
              Effortless
            </h1>
            <div className="text-4xl font-light text-primary gradient-primary bg-clip-text text-transparent">
              Sessions
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse-glow" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join collaborative study rooms, track focus sessions, and boost productivity with our community-driven platform
          </p>
        </div>

        {/* Quick Stats */}
        {stats.totalSessions > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
            <Card className="gradient-card shadow-card border-border">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(stats.weeklyTime)}
                </p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>

            <Card className="gradient-card shadow-card border-border">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalSessions}
                </p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </CardContent>
            </Card>

            <Card className="gradient-card shadow-card border-border">
              <CardContent className="p-6 text-center">
                <Timer className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(Math.round(stats.avgSessionLength))}
                </p>
                <p className="text-sm text-muted-foreground">Average Session</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="max-w-md mx-auto space-y-4 animate-scale-in">
          <Button
            variant="gradient"
            size="lg"
            onClick={() => navigate('/rooms')}
            className="w-full h-16 text-lg shadow-glow hover:shadow-hover transition-smooth"
          >
            <Users className="w-6 h-6 mr-3" />
            Join Study Rooms
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/start')}
            className="w-full h-16 text-lg hover:bg-secondary transition-smooth"
          >
            <Timer className="w-6 h-6 mr-3" />
            Start Session
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/history')}
            className="w-full h-16 text-lg hover:bg-secondary transition-smooth"
          >
            <History className="w-6 h-6 mr-3" />
            View History
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Focus Timer</h3>
            <p className="text-muted-foreground">
              Clean, distraction-free timer with pause, resume, and stop controls
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Study Rooms</h3>
            <p className="text-muted-foreground">
              Join collaborative study sessions with real-time participants and shared music
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Session History</h3>
            <p className="text-muted-foreground">
              Review past sessions with filtering and sorting options
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
