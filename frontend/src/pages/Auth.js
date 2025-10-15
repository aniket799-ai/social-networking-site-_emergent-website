import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { api } from '../App';
import { Sparkles, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    profession: '',
    bio: '',
    location: '',
  });

  const professions = ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Lawyer', 'Entrepreneur', 'Designer', 'Writer'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await api.post(endpoint, data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      window.dispatchEvent(new Event('storage'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-10 h-10 text-violet-600" />
            <span className="text-3xl font-bold text-slate-800">ProfNetwork</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-700">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    data-testid="username-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    data-testid="fullname-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) => setFormData({ ...formData, profession: value })}
                    required
                  >
                    <SelectTrigger data-testid="profession-select" className="mt-1">
                      <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map((prof) => (
                        <SelectItem key={prof} value={prof}>
                          {prof}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    data-testid="location-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    data-testid="bio-input"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode-btn"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
