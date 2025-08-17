import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SessionStorage } from '@/lib/storage';
import { Session, SessionCategory } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { ArrowLeft, Calendar, Clock, TrendingUp, Trash2 } from 'lucide-react';

export default function SessionHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  useEffect(() => {
    const allSessions = SessionStorage.getAllSessions();
    setSessions(allSessions);
    setFilteredSessions(allSessions);
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(session => session.category === filterCategory);
    }

    // Sort sessions
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'duration':
          return (b.actualDuration || 0) - (a.actualDuration || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, filterCategory, sortBy]);

  const deleteSession = (sessionId: string) => {
    SessionStorage.deleteSession(sessionId);
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
  };

  const stats = SessionStorage.getSessionStats();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const getCategoryColor = (category: SessionCategory) => {
    switch (category) {
      case 'Study': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Work': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Fitness': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Custom': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-2xl font-bold text-foreground">Session History</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="gradient-card shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatDuration(stats.weeklyTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {completedSessions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatDuration(Math.round(stats.avgSessionLength))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="gradient-card shadow-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Filter by Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card className="gradient-card shadow-card border-border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No sessions found</p>
                <Button
                  variant="gradient"
                  onClick={() => navigate('/start')}
                  className="mt-4"
                >
                  Start Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSessions.map((session) => (
              <Card key={session.id} className="gradient-card shadow-card border-border hover:shadow-hover transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {session.title}
                        </h3>
                        <Badge className={getCategoryColor(session.category)}>
                          {session.category}
                        </Badge>
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {session.startTime.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(session.actualDuration || session.duration)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}