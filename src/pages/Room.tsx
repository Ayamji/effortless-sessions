import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Room as RoomType, RoomParticipant, SessionCategory, RoomSession } from '@/lib/types';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ArrowLeft, Users, Play, LogOut, Clock } from 'lucide-react';

const categories: SessionCategory[] = ['Study', 'Work', 'Fitness', 'Custom'];

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [recentSessions, setRecentSessions] = useState<RoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCategory, setSessionCategory] = useState<SessionCategory>('Study');
  const [sessionDuration, setSessionDuration] = useState(25);

  // Timer state
  const [timerState, setTimerState] = useState({
    isRunning: false,
    isPaused: false,
    timeRemaining: 0,
    totalTime: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!roomId) {
      navigate('/rooms');
      return;
    }

    fetchRoomData();
    setupRealtimeSubscriptions();
  }, [user, roomId, navigate]);

  const fetchRoomData = async () => {
    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData as RoomType);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('room_participants')
        .select(`
          *,
          profiles!inner (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_active', true);

      if (participantsError) throw participantsError;
      setParticipants(participantsData as any || []);

      // Fetch recent sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('room_sessions')
        .select(`
          *,
          profiles!inner (
            username
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setRecentSessions(sessionsData as any || []);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load room data',
        variant: 'destructive'
      });
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to participants changes
    const participantsChannel = supabase
      .channel(`room_participants_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchRoomData();
        }
      )
      .subscribe();

    // Subscribe to sessions changes
    const sessionsChannel = supabase
      .channel(`room_sessions_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_sessions',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  };

  const leaveRoom = async () => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user!.id);

      if (error) throw error;
      navigate('/rooms');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to leave room',
        variant: 'destructive'
      });
    }
  };

  const startSession = async () => {
    if (!sessionTitle.trim()) return;

    try {
      // Update participant with session info
      await supabase
        .from('room_participants')
        .update({
          session_title: sessionTitle,
          session_duration: sessionDuration
        })
        .eq('room_id', roomId)
        .eq('user_id', user!.id);

      // Start timer
      const totalSeconds = sessionDuration * 60;
      setTimerState({
        isRunning: true,
        isPaused: false,
        timeRemaining: totalSeconds,
        totalTime: totalSeconds
      });

      setSessionDialogOpen(false);
      setSessionTitle('');
      setSessionDuration(25);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start session',
        variant: 'destructive'
      });
    }
  };

  const handleTimerComplete = async () => {
    try {
      // Save completed session
      await supabase
        .from('room_sessions')
        .insert({
          room_id: roomId!,
          user_id: user!.id,
          title: sessionTitle,
          category: sessionCategory,
          duration: sessionDuration,
          actual_duration: sessionDuration,
          status: 'completed'
        });

      // Clear participant session info
      await supabase
        .from('room_participants')
        .update({
          session_title: null,
          session_duration: null
        })
        .eq('room_id', roomId)
        .eq('user_id', user!.id);

      setTimerState({
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
        totalTime: 0
      });

      toast({
        title: 'Session completed!',
        description: 'Great work! Your session has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save session',
        variant: 'destructive'
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Room not found</h2>
          <Button onClick={() => navigate('/rooms')}>Back to Rooms</Button>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: SessionCategory) => {
    const colors = {
      Study: 'bg-blue-500/20 text-blue-300',
      Work: 'bg-green-500/20 text-green-300',
      Fitness: 'bg-orange-500/20 text-orange-300',
      Custom: 'bg-purple-500/20 text-purple-300'
    };
    return colors[category];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/rooms')}
              className="text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{room.name}</h1>
              {room.description && (
                <p className="text-text-secondary">{room.description}</p>
              )}
            </div>
            <Badge className={getCategoryColor(room.category)}>
              {room.category}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {!timerState.isRunning && (
              <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-accent/20">
                  <DialogHeader>
                    <DialogTitle>Start New Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-title">Session Title</Label>
                      <Input
                        id="session-title"
                        placeholder="What will you work on?"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-category">Category</Label>
                      <Select value={sessionCategory} onValueChange={(value: SessionCategory) => setSessionCategory(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="session-duration">Duration (minutes)</Label>
                      <Input
                        id="session-duration"
                        type="number"
                        min="1"
                        max="180"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(parseInt(e.target.value) || 25)}
                      />
                    </div>
                    <Button onClick={startSession} className="w-full" disabled={!sessionTitle.trim()}>
                      Start Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" onClick={leaveRoom} className="text-text-secondary">
              <LogOut className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer and Active Session */}
          <div className="lg:col-span-2 space-y-6">
            {timerState.isRunning && (
              <Card className="bg-surface/80 backdrop-blur-sm border-accent/20">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">Active Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimerDisplay
                    timerState={timerState}
                    setTimerState={setTimerState}
                    onComplete={handleTimerComplete}
                    title={sessionTitle}
                    category={sessionCategory}
                  />
                </CardContent>
              </Card>
            )}

            {/* Recent Sessions */}
            <Card className="bg-surface/80 backdrop-blur-sm border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text-primary">
                  <Clock className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-surface-darker/50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-text-primary">{session.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span>{session.profiles?.username || 'Unknown'}</span>
                            <span>•</span>
                            <Badge className={getCategoryColor(session.category)} variant="outline">
                              {session.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-text-primary font-medium">
                            {formatDuration(session.actual_duration || session.duration)}
                          </div>
                          <div className="text-text-secondary">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-secondary py-8">
                    No sessions yet. Start the first one!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Participants */}
          <Card className="bg-surface/80 backdrop-blur-sm border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Users className="h-5 w-5" />
                Participants ({participants.length}/{room.max_participants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-surface-darker/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-text-primary">
                        {participant.profiles?.username || 'Anonymous'}
                        {participant.user_id === user?.id && (
                          <span className="text-xs text-primary ml-2">(You)</span>
                        )}
                      </div>
                      {participant.session_title && (
                        <div className="text-sm text-text-secondary">
                          Working on: {participant.session_title}
                          {participant.session_duration && (
                            <span className="ml-2">({participant.session_duration}m)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Room;