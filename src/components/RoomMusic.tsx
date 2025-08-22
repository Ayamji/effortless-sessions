import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music, Play, Pause, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomMusicProps {
  musicUrl?: string;
  musicTitle?: string;
  onUpdateMusic: (url: string, title: string) => Promise<void>;
  isUpdating: boolean;
}

const RoomMusic = ({ musicUrl, musicTitle, onUpdateMusic, isUpdating }: RoomMusicProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const { toast } = useToast();

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`;
  };

  const handleUpdateMusic = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive'
      });
      return;
    }

    const videoId = extractYouTubeId(inputUrl);
    if (!videoId) {
      toast({
        title: 'Error',
        description: 'Please enter a valid YouTube URL',
        variant: 'destructive'
      });
      return;
    }

    try {
      await onUpdateMusic(inputUrl, inputTitle || 'Untitled');
      setDialogOpen(false);
      setInputUrl('');
      setInputTitle('');
      toast({
        title: 'Music updated!',
        description: 'The room music has been updated for everyone.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update music. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const currentVideoId = musicUrl ? extractYouTubeId(musicUrl) : null;

  return (
    <Card className="gradient-card shadow-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Music className="h-5 w-5" />
            Study Music
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Volume2 className="h-4 w-4 mr-2" />
                Change Music
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Share Study Music</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="music-url">YouTube URL</Label>
                  <Input
                    id="music-url"
                    placeholder="https://youtube.com/watch?v=... (lofi, study with me, etc.)"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Share lofi hip hop, study with me videos, or ambient music
                  </p>
                </div>
                <div>
                  <Label htmlFor="music-title">Title (optional)</Label>
                  <Input
                    id="music-title"
                    placeholder="e.g., Lofi Hip Hop - Study Mix"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleUpdateMusic} 
                  className="w-full" 
                  disabled={!inputUrl.trim() || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Music'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {currentVideoId ? (
          <div className="space-y-3">
            {musicTitle && (
              <div className="text-sm font-medium text-foreground mb-3">
                Now Playing: {musicTitle}
              </div>
            )}
            <div className="relative aspect-video bg-secondary/20 rounded-lg overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(currentVideoId)}
                title="Study Music"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              🎵 Perfect for studying, working, or focusing together
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No music playing in this room yet
            </p>
            <p className="text-xs text-muted-foreground">
              Share some lofi beats or study music to help everyone focus!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomMusic;