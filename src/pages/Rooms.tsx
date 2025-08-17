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
  }, [user, navigate]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_participants!inner(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add participant count to rooms
      const roomsWithCount = data?.map(room => ({
        ...room,
        participant_count: room.room_participants?.length || 0
      })) as Room[] || [];
      
      setRooms(roomsWithCount);
    } catch (error: any) {
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
      Study: 'bg-blue-500/20 text-blue-300',
      Work: 'bg-green-500/20 text-green-300',
      Fitness: 'bg-orange-500/20 text-orange-300',
      Custom: 'bg-purple-500/20 text-purple-300'
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
    <div className="min-h-screen bg-gradient-to-br from-surface-dark to-surface-darker p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-elegant bg-clip-text text-transparent">
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
              <DialogContent className="bg-surface border-accent/20">
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
            <Button variant="outline" onClick={signOut} className="text-text-secondary">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="bg-surface/80 backdrop-blur-sm border-accent/20 hover:border-accent/40 transition-all cursor-pointer"
              onClick={() => joinRoom(room.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-text-primary">{room.name}</CardTitle>
                  <Badge className={getCategoryColor(room.category)}>
                    {room.category}
                  </Badge>
                </div>
                {room.description && (
                  <p className="text-sm text-text-secondary">{room.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-text-secondary">
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
            <h3 className="text-xl font-semibold text-text-primary mb-2">No rooms available</h3>
            <p className="text-text-secondary mb-4">Create the first room to get started!</p>
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