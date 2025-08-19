import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Room, SessionCategory } from '@/lib/types';
import { Plus, Users, ArrowLeft, LogOut } from 'lucide-react';

const categories: SessionCategory[] = ['Study', 'Work', 'Fitness', 'Custom'];

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState<SessionCategory>('Study');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRooms();
    setupRealtimeSubscriptions();
  }, [user, navigate]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to rooms changes
    const roomsChannel = supabase
      .channel('rooms_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        () => {
          console.log('Rooms changed, refreshing...');
          fetchRooms();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants'
        },
        () => {
          console.log('Participants changed, refreshing rooms...');
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up rooms subscriptions');
      supabase.removeChannel(roomsChannel);
    };
  };

  const fetchRooms = async () => {
    try {
      // Fetch rooms and participant counts separately
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get participant counts for each room
      const roomsWithCount = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_active', true);
          
          return {
            ...room,
            participant_count: count || 0
          };
        })
      );
      
      setRooms(roomsWithCount as Room[]);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rooms',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          description: newRoomDescription,
          category: newRoomCategory,
          creator_id: user!.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Room created successfully!'
      });

      setCreateDialogOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomCategory('Study');
      fetchRooms();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive'
      });
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      // Check if already joined
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user!.id)
        .single();

      if (existingParticipant) {
        navigate(`/room/${roomId}`);
        return;
      }

      // Join the room
      const { error } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: user!.id
        });

      if (error) throw error;

      navigate(`/room/${roomId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive'
      });
    }
  };

  const getCategoryColor = (category: SessionCategory) => {
    const colors = {
      Study: 'bg-primary/20 text-primary',
      Work: 'bg-success/20 text-success',
      Fitness: 'bg-warning/20 text-warning',
      Custom: 'bg-accent text-accent-foreground'
    };
    return colors[category];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Study Rooms
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="e.g., Math Study Group"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-description">Description (Optional)</Label>
                    <Input
                      id="room-description"
                      placeholder="What will you be working on?"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-category">Category</Label>
                    <Select value={newRoomCategory} onValueChange={(value: SessionCategory) => setNewRoomCategory(value)}>
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
                  <Button onClick={createRoom} className="w-full" disabled={!newRoomName.trim()}>
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="gradient-card shadow-card border-border hover:border-primary/40 transition-smooth cursor-pointer"
              onClick={() => joinRoom(room.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">{room.name}</CardTitle>
                  <Badge className={getCategoryColor(room.category)}>
                    {room.category}
                  </Badge>
                </div>
                {room.description && (
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{room.participant_count || 0}/{room.max_participants}</span>
                  </div>
                  <span>Click to join</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-2">No rooms available</h3>
            <p className="text-muted-foreground mb-4">Create the first room to get started!</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;