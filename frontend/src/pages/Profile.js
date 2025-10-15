import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { MapPin, Briefcase, Calendar, Edit, MessageSquare, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
  });
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnProfile = !userId || userId === currentUser.id;

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const endpoint = isOwnProfile ? '/auth/me' : `/users/${userId}`;
      const response = await api.get(endpoint);
      setUser(response.data);
      setEditForm({
        full_name: response.data.full_name,
        bio: response.data.bio || '',
        location: response.data.location || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      await api.put('/users/profile', editForm);
      toast.success('Profile updated!');
      setEditDialogOpen(false);
      fetchUser();
      // Update localStorage
      const updatedUser = { ...currentUser, ...editForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const sendConnectionRequest = async () => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  const getProfessionGradient = (profession) => {
    const colors = {
      engineer: 'from-violet-500 to-purple-600',
      doctor: 'from-pink-500 to-rose-600',
      artist: 'from-cyan-500 to-blue-600',
      teacher: 'from-emerald-500 to-teal-600',
    };
    return colors[profession?.toLowerCase()] || 'from-indigo-500 to-purple-600';
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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-8 animate-fade-in-up">
          <div className={`bg-gradient-to-r ${getProfessionGradient(user.profession)} rounded-2xl p-8 mb-6 -mt-8 -mx-8`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-white text-violet-600 font-bold text-3xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-1">{user.full_name}</h1>
                  <p className="text-lg opacity-90">@{user.username}</p>
                </div>
              </div>
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="edit-profile-btn" className="bg-white text-violet-600 hover:bg-slate-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            data-testid="edit-fullname-input"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            data-testid="edit-location-input"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            data-testid="edit-bio-input"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <Button
                          data-testid="save-profile-btn"
                          onClick={updateProfile}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    data-testid="logout-btn"
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-white text-red-600 border-white hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    data-testid="send-message-btn"
                    onClick={() => navigate(`/messages/${user.id}`)}
                    className="bg-white text-violet-600 hover:bg-slate-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    data-testid="connect-btn"
                    onClick={sendConnectionRequest}
                    className="bg-white text-violet-600 hover:bg-slate-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-violet-100 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Profession</p>
                <p className="font-semibold text-slate-800">{user.profession}</p>
              </div>
            </div>
            {user.location && (
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="font-semibold text-slate-800">{user.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Joined</p>
                <p className="font-semibold text-slate-800">
                  {format(new Date(user.created_at), 'MMM yyyy')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bio Section */}
        {user.bio && (
          <Card className="p-6 animate-fade-in-up delay-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">About</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{user.bio}</p>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up delay-200">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-violet-600 mb-2">{user.connections?.length || 0}</div>
            <div className="text-slate-600">Connections</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{user.email ? '✓' : '✗'}</div>
            <div className="text-slate-600">Verified</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-slate-600">Days Active</div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
