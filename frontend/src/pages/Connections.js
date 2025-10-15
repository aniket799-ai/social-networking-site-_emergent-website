import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, UserCheck, UserPlus, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [connectionsRes, pendingRes] = await Promise.all([
        api.get('/connections'),
        api.get('/connections/pending'),
      ]);
      setConnections(connectionsRes.data);
      setPendingRequests(pendingRes.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await api.post(`/connections/accept/${userId}`);
      toast.success('Connection accepted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept connection');
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await api.post(`/connections/reject/${userId}`);
      toast.success('Request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getProfessionColor = (profession) => {
    const colors = {
      engineer: 'bg-violet-100 text-violet-700',
      doctor: 'bg-pink-100 text-pink-700',
      artist: 'bg-cyan-100 text-cyan-700',
      teacher: 'bg-emerald-100 text-emerald-700',
    };
    return colors[profession?.toLowerCase()] || 'bg-slate-100 text-slate-700';
  };

  const UserCard = ({ user, isPending = false, index }) => (
    <Card
      data-testid={isPending ? `pending-request-${index}` : `connection-${index}`}
      className="p-6 hover:shadow-lg smooth-transition animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Avatar className="w-14 h-14">
            <AvatarFallback className={`${getProfessionColor(user.profession)} font-semibold text-xl`}>
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-800">{user.full_name}</h3>
            <p className="text-sm text-slate-600">@{user.username}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProfessionColor(user.profession)}`}>
                <Briefcase className="w-3 h-3 inline mr-1" />
                {user.profession}
              </span>
              {user.location && (
                <span className="text-xs text-slate-500">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {user.location}
                </span>
              )}
            </div>
            {user.bio && <p className="text-sm text-slate-600 mt-2">{user.bio}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {isPending ? (
            <>
              <Button
                data-testid={`accept-request-${index}`}
                size="sm"
                onClick={() => acceptRequest(user.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                data-testid={`reject-request-${index}`}
                size="sm"
                variant="outline"
                onClick={() => rejectRequest(user.id)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Decline
              </Button>
            </>
          ) : (
            <>
              <Button
                data-testid={`view-profile-${index}`}
                size="sm"
                onClick={() => navigate(`/profile/${user.id}`)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                View Profile
              </Button>
              <Button
                data-testid={`message-user-${index}`}
                size="sm"
                variant="outline"
                onClick={() => navigate(`/messages/${user.id}`)}
              >
                Message
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Connections</h1>
          <p className="text-slate-600">Manage your professional network</p>
        </div>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger data-testid="connections-tab" value="connections" className="text-base">
              <Users className="w-4 h-4 mr-2" />
              Connections ({connections.length})
            </TabsTrigger>
            <TabsTrigger data-testid="pending-tab" value="pending" className="text-base">
              <UserPlus className="w-4 h-4 mr-2" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No connections yet</h3>
                <p className="text-slate-600 mb-4">Start discovering and connecting with professionals</p>
                <Button
                  data-testid="discover-professionals-btn"
                  onClick={() => navigate('/discover')}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Discover Professionals
                </Button>
              </Card>
            ) : (
              connections.map((user, idx) => (
                <UserCard key={user.id} user={user} index={idx} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No pending requests</h3>
                <p className="text-slate-600">You'll see connection requests here</p>
              </Card>
            ) : (
              pendingRequests.map((user, idx) => (
                <UserCard key={user.id} user={user} isPending={true} index={idx} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Connections;
