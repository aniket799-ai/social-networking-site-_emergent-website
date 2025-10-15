import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Users, MessageCircle, TrendingUp, Award, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const professions = [
    { name: 'Engineers', color: 'from-violet-500 to-purple-600', icon: '🔧' },
    { name: 'Doctors', color: 'from-pink-500 to-rose-600', icon: '⚕️' },
    { name: 'Artists', color: 'from-cyan-500 to-blue-600', icon: '🎨' },
    { name: 'Teachers', color: 'from-emerald-500 to-teal-600', icon: '📚' },
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Professional Networking',
      description: 'Connect with professionals from various fields and expand your network',
      color: 'bg-violet-50 text-violet-600',
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Real-time Messaging',
      description: 'Communicate instantly with your connections through our chat system',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Career Growth',
      description: 'Share insights, learn from others, and grow your professional presence',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Industry Insights',
      description: 'Stay updated with trends and discussions in your field',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px]" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-violet-600" />
              <span className="text-2xl font-bold text-slate-800">ProfNetwork</span>
            </div>
            <Button
              data-testid="nav-signin-btn"
              onClick={() => navigate('/auth')}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
                Connect with
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> Professionals </span>
                Worldwide
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
              Build meaningful connections, share knowledge, and grow your career with a community of professionals from diverse industries.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-6 rounded-full"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                data-testid="hero-learn-more-btn"
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full border-2 border-violet-200 hover:border-violet-300"
                onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Profession Pills */}
            <div className="flex flex-wrap gap-3 justify-center mt-12 animate-fade-in-up delay-300">
              {professions.map((prof, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-full bg-white shadow-md border border-slate-200 smooth-transition`}
                  style={{
                    transform: `translateY(${scrollY * 0.05}px)`,
                  }}
                >
                  <span className="text-2xl">{prof.icon}</span>
                  <span className="font-medium text-slate-700">{prof.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Why Choose ProfNetwork?</h2>
          <p className="text-lg text-slate-600">Everything you need to build and grow your professional network</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              data-testid={`feature-card-${idx}`}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl smooth-transition border border-slate-100"
            >
              <div className={`${feature.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals already networking and growing their careers
          </p>
          <Button
            data-testid="cta-join-now-btn"
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-white text-violet-600 hover:bg-slate-50 text-lg px-10 py-6 rounded-full"
          >
            Join Now - It's Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold text-white">ProfNetwork</span>
          </div>
          <p className="text-sm">© 2025 ProfNetwork. Built for professionals, by professionals.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
