import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Search, Briefcase, MapPin, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Discover = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const professions = ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Lawyer', 'Entrepreneur', 'Designer', 'Writer'];

  useEffect(() => {
    fetchUsers();
  }, [profession]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (profession) params.profession = profession;
      if (search) params.search = search;
      
      const response = await api.get('/users', { params });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const sendConnectionRequest = async (userId) => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Discover Professionals</h1>
          <p className="text-slate-600">Find and connect with professionals from various industries</p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-8 animate-fade-in-up delay-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                data-testid="search-input"
                placeholder="Search by name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button
                data-testid="search-btn"
                onClick={handleSearch}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger data-testid="profession-filter" className="w-full md:w-48">
                <SelectValue placeholder="Filter by profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Professions</SelectItem>
                {professions.map((prof) => (
                  <SelectItem key={prof} value={prof}>
                    {prof}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Users Grid */}
        {users.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">No professionals found. Try adjusting your filters.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, idx) => (
              <Card
                key={user.id}
                data-testid={`user-card-${idx}`}
                className="p-6 hover:shadow-lg smooth-transition animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="text-center mb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarFallback className={`${getProfessionColor(user.profession)} font-semibold text-2xl`}>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-slate-800">{user.full_name}</h3>
                  <p className="text-sm text-slate-600">@{user.username}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className={`px-3 py-2 rounded-lg text-center ${getProfessionColor(user.profession)}`}>
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    <span className="text-sm font-medium">{user.profession}</span>
                  </div>
                  {user.location && (
                    <div className="text-center text-sm text-slate-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {user.location}
                    </div>
                  )}
                </div>

                {user.bio && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{user.bio}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    data-testid={`view-profile-${idx}`}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="flex-1"
                  >
                    View Profile
                  </Button>
                  <Button
                    data-testid={`connect-${idx}`}
                    size="sm"
                    onClick={() => sendConnectionRequest(user.id)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Discover;
