import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Users, MessageSquare, Heart, FileText, TrendingUp, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Connections',
      value: stats?.total_connections || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Posts',
      value: stats?.total_posts || 0,
      icon: <FileText className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Likes',
      value: stats?.total_likes || 0,
      icon: <Heart className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      title: 'Comments',
      value: stats?.total_comments || 0,
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
  ];

  const engagementData = [
    { name: 'Posts', value: stats?.total_posts || 0 },
    { name: 'Likes', value: stats?.total_likes || 0 },
    { name: 'Comments', value: stats?.total_comments || 0 },
  ];

  const activityData = [
    { month: 'Jan', posts: 4, connections: 2 },
    { month: 'Feb', posts: 6, connections: 5 },
    { month: 'Mar', posts: 8, connections: 8 },
    { month: 'Apr', posts: stats?.total_posts || 10, connections: stats?.total_connections || 12 },
  ];

  const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  const getProfessionGradient = () => {
    const profession = user.profession?.toLowerCase();
    switch (profession) {
      case 'engineer':
        return 'from-violet-500 to-purple-600';
      case 'doctor':
        return 'from-pink-500 to-rose-600';
      case 'artist':
        return 'from-cyan-500 to-blue-600';
      case 'teacher':
        return 'from-emerald-500 to-teal-600';
      default:
        return 'from-indigo-500 to-purple-600';
    }
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
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className={`bg-gradient-to-r ${getProfessionGradient()} rounded-3xl p-8 md:p-12 text-white shadow-2xl animate-fade-in-up`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">Welcome back, {user.full_name}!</h1>
              <p className="text-lg opacity-90">{user.profession} • {stats?.profession_count || 0} professionals in your field</p>
            </div>
            <div className="flex items-center space-x-4">
              {stats?.pending_requests > 0 && (
                <div
                  data-testid="pending-requests-badge"
                  onClick={() => navigate('/connections')}
                  className="bg-white bg-opacity-20 backdrop-blur-md px-6 py-3 rounded-full cursor-pointer hover:bg-opacity-30 smooth-transition"
                >
                  <UserPlus className="w-5 h-5 inline mr-2" />
                  {stats.pending_requests} New Requests
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up delay-100">
          {statCards.map((card, idx) => (
            <Card
              key={idx}
              data-testid={`stat-card-${idx}`}
              className="p-6 hover:shadow-lg smooth-transition border-2 border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} ${card.textColor} p-4 rounded-xl`}>
                  {card.icon}
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{card.value}</h3>
              <p className="text-slate-600">{card.title}</p>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Chart */}
          <Card className="p-6 animate-fade-in-up delay-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Engagement Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity Trend */}
          <Card className="p-6 animate-fade-in-up delay-300">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Activity Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="connections" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-8 animate-fade-in-up delay-400">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              data-testid="quick-action-discover"
              onClick={() => navigate('/discover')}
              className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl smooth-transition border-2 border-violet-200 text-left"
            >
              <Users className="w-8 h-8 text-violet-600 mb-3" />
              <h4 className="font-semibold text-slate-800 mb-1">Discover Professionals</h4>
              <p className="text-sm text-slate-600">Find and connect with new professionals</p>
            </button>
            <button
              data-testid="quick-action-post"
              onClick={() => navigate('/feed')}
              className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl smooth-transition border-2 border-blue-200 text-left"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-slate-800 mb-1">Share Update</h4>
              <p className="text-sm text-slate-600">Post something to your network</p>
            </button>
            <button
              data-testid="quick-action-messages"
              onClick={() => navigate('/messages')}
              className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl smooth-transition border-2 border-emerald-200 text-left"
            >
              <MessageSquare className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-semibold text-slate-800 mb-1">Messages</h4>
              <p className="text-sm text-slate-600">Chat with your connections</p>
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
