import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Users, MessageSquare, User, Compass, Sparkles, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard', testId: 'nav-dashboard' },
    { icon: <Compass className="w-5 h-5" />, label: 'Discover', path: '/discover', testId: 'nav-discover' },
    { icon: <Users className="w-5 h-5" />, label: 'Feed', path: '/feed', testId: 'nav-feed' },
    { icon: <Users className="w-5 h-5" />, label: 'Connections', path: '/connections', testId: 'nav-connections' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', path: '/messages', testId: 'nav-messages' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile', testId: 'nav-profile' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/dashboard')}
              data-testid="logo"
            >
              <Sparkles className="w-8 h-8 text-violet-600" />
              <span className="text-2xl font-bold text-slate-800">ProfNetwork</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  data-testid={item.testId}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={`${
                    isActive(item.path)
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              data-testid="mobile-menu-btn"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-4">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  data-testid={`${item.testId}-mobile`}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    isActive(item.path)
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-73px)]">{children}</main>
    </div>
  );
};

export default Layout;
