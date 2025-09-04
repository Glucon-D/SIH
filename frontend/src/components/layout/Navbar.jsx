import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, Settings, Info, Phone, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home', public: true },
    { path: '/about', label: 'About', public: true },
    { path: '/contact', label: 'Contact', public: true },
    { path: '/dashboard', label: 'Dashboard', public: false },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-green-600 dark:text-green-400">
              Digital Krishi Officer
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                if (!link.public && !isAuthenticated) return null;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActivePath(link.path)
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-300 group overflow-hidden"
              aria-label="Toggle theme"
            >
              <div className="relative z-10">
                {effectiveTheme === 'dark' ? (
                  <Sun className="w-5 h-5 rotate-0 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 rotate-0 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </button>

            {isAuthenticated ? (
              /* User avatar and menu dropdown container */
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group"
                >
                  {/* Enhanced Avatar with Online Status */}
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white font-semibold text-sm shadow-lg group-hover:shadow-xl transition-all duration-200">
                      {(user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>
                  
                  {/* User Name (hidden on small screens) */}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.profile?.firstName || user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                  </div>
                  
                  {/* Enhanced Menu Icon */}
                  <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                    <div className={`transform transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                      {isProfileMenuOpen ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Menu className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50 dark:border-gray-700/50 animate-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-semibold text-sm">
                          {(user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.profile?.firstName || user?.username || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email || 'user@example.com'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Dashboard</p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </Link>
                      
                      <Link
                        to="/about"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        About
                      </Link>
                      
                      <Link
                        to="/contact"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        Contact
                      </Link>
                    </div>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-xs text-gray-500">End your session</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Enhanced Auth buttons */
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Enhanced Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group"
              aria-label="Toggle mobile menu"
            >
              <div className="relative z-10 transform transition-transform duration-200 group-hover:scale-110">
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </div>
              {/* Subtle background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              {!isAuthenticated && navLinks.map((link) => {
                if (!link.public && !isAuthenticated) return null;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActivePath(link.path)
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Enhanced Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mr-4 transition-all duration-200">
                  {effectiveTheme === 'dark' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                {effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              {/* Enhanced Mobile auth section */}
              {isAuthenticated ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  {/* Enhanced Mobile User Info Section */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200/50 dark:border-green-700/50 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {(user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user?.profile?.firstName || user?.username || 'User'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email || 'user@example.com'}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/about"
                    className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-4">
                      <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    Contact
                  </Link>
                  
                  <hr className="my-4 border-gray-200 dark:border-gray-600" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mr-4">
                      <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Sign Out</p>
                      <p className="text-sm text-gray-500">End your session</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
