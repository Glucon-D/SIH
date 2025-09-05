import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Info,
  Phone,
  LayoutDashboard,
  ChevronUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NudgesModal from "../nudges/NudgesModal";
import { ChevronRight } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showNudgesModal, setShowNudgesModal] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsProfileMenuOpen(false);
  };

  const handleAINudges = () => {
    if (isAuthenticated) {
      setShowNudgesModal(true);
    } else {
      navigate("/login");
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Home", public: true },
    { path: "/about", label: "About", public: true },
    { path: "/contact", label: "Contact", public: true },
    { path: "/dashboard", label: "Dashboard", public: false },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl shadow-lg border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center lg:w-1/3">
              <Link
                to={isAuthenticated ? "/dashboard" : "/"}
                className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300 tracking-tight"
              >
                <span className="hidden sm:inline">Digital Krishi Officer</span>
                <span className="sm:hidden">DKO</span>
              </Link>
            </div>

            {/* Center Section - Navigation Links (Desktop Only) - Hidden when authenticated */}
            {!isAuthenticated && (
              <div className="hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center space-x-1 bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl p-1.5 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
                  {navLinks.map((link) => {
                    // Only show public routes when not authenticated
                    if (!link.public) return null;

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                          isActivePath(link.path)
                            ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-lg shadow-green-500/25"
                            : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/60 dark:hover:bg-gray-700/60"
                        }`}
                      >
                        <span className="relative z-10 flex items-center">
                          {link.label}
                          {/* Modern active indicator */}
                          {isActivePath(link.path) && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          )}
                        </span>

                        {/* Animated hover background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>

                        {/* Modern underline animation */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transform origin-left transition-transform duration-300 ${
                            isActivePath(link.path)
                              ? "scale-x-100"
                              : "scale-x-0 group-hover:scale-x-100"
                          }`}
                        ></div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Section - Actions */}
            <div className="flex items-center justify-end space-x-3 lg:w-1/3">
              {/* Modern Theme toggle - Hidden on mobile to save space */}
              <button
                onClick={toggleTheme}
                className="hidden sm:flex relative p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-300 group overflow-hidden backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
                aria-label="Toggle theme"
              >
                <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                  {effectiveTheme === "dark" ? (
                    <Sun className="w-5 h-5 rotate-0 group-hover:rotate-180 transition-transform duration-500 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 rotate-0 group-hover:-rotate-12 transition-transform duration-300 text-indigo-600" />
                  )}
                </div>
                {/* Modern glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"></div>
              </button>

              {/* AI Nudges Button - Only show when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={handleAINudges}
                  className="hidden sm:flex relative p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gradient-to-br from-green-100/60 to-blue-100/60 dark:from-green-900/30 dark:to-blue-900/30 hover:from-green-200/80 hover:to-blue-200/80 dark:hover:from-green-800/50 dark:hover:to-blue-800/50 transition-all duration-300 group overflow-hidden backdrop-blur-xl border border-green-200/50 dark:border-green-700/50"
                  aria-label="Get AI farming nudges"
                  title="Get AI farming nudges based on your location and weather"
                >
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-300" />
                  </div>
                  {/* Modern glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"></div>
                </button>
              )}

              {isAuthenticated ? (
                /* User avatar and menu dropdown container */
                <div className="hidden lg:block relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group"
                  >
                    {/* Enhanced Avatar with Online Status */}
                    <div className="relative">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white font-semibold text-sm shadow-lg group-hover:shadow-xl transition-all duration-200">
                        {(
                          user?.profile?.firstName?.charAt(0) ||
                          user?.username?.charAt(0) ||
                          "U"
                        ).toUpperCase()}
                      </div>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    </div>

                    {/* User Name (hidden on small screens) */}
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.profile?.firstName || user?.username || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Online
                      </p>
                    </div>

                    {/* Enhanced Menu Icon */}
                    <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 outline-none focus:ring-0 focus:outline-none transition-colors duration-200">
                      <div
                        className={`transform transition-transform duration-200 ${
                          isProfileMenuOpen ? "rotate-180" : ""
                        }`}
                      >
                        {isProfileMenuOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
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
                            {(
                              user?.profile?.firstName?.charAt(0) ||
                              user?.username?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.profile?.firstName ||
                                user?.username ||
                                "User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email || "user@example.com"}
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
                            <p className="text-xs text-gray-500">
                              Manage your account
                            </p>
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
                          <p className="text-xs text-gray-500">
                            End your session
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Modern Auth buttons - Hidden on mobile */
                <div className="hidden lg:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="relative px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </Link>
                </div>
              )}

              {/* Modern Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
                aria-label="Toggle mobile menu"
              >
                <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110">
                  {isMenuOpen ? (
                    <X className="w-6 h-6 rotate-0 group-hover:rotate-90 transition-transform duration-300" />
                  ) : (
                    <Menu className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
                  )}
                </div>
                {/* Modern glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </button>
            </div>
          </div>

          {/* Modern Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden animate-in slide-in-from-top-2 duration-300">
              <div className="px-4 pt-4 pb-6 space-y-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                {/* Mobile Navigation Links - Hidden when authenticated */}
                {!isAuthenticated && (
                  <div className="space-y-2">
                    {navLinks.map((link) => {
                      // Only show public routes when not authenticated
                      if (!link.public) return null;

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center px-4 py-4 rounded-2xl text-base font-medium transition-all duration-300 group ${
                            isActivePath(link.path)
                              ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-lg shadow-green-500/25"
                              : "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="relative">
                            {link.label}
                            {isActivePath(link.path) && (
                              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/50 rounded-full"></div>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Modern Mobile theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center w-full px-4 py-4 rounded-2xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                    {effectiveTheme === "dark" ? (
                      <Sun className="w-6 h-6 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
                    ) : (
                      <Moon className="w-6 h-6 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                    )}
                  </div>
                  <span className="flex-1 text-left">
                    {effectiveTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>

                {/* Mobile auth section or user menu */}
                {!isAuthenticated ? (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <Link
                      to="/login"
                      className="block px-4 py-4 text-center text-base font-medium text-green-600 dark:text-green-400 bg-green-50/80 dark:bg-green-900/30 hover:bg-green-100/80 dark:hover:bg-green-900/50 rounded-2xl transition-all duration-300 backdrop-blur-xl border border-green-200/50 dark:border-green-700/50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-4 text-center text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  /* Mobile authenticated user section */
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    {/* Enhanced Mobile User Info Section */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200/50 dark:border-green-700/50 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {(
                            user?.profile?.firstName?.charAt(0) ||
                            user?.username?.charAt(0) ||
                            "U"
                          ).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user?.profile?.firstName || user?.username || "User"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user?.email || "user@example.com"}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                        <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Dashboard
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
                        <p className="text-sm text-gray-500">
                          End your session
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* AI Nudges Modal */}
      <NudgesModal
        isOpen={showNudgesModal}
        onClose={() => setShowNudgesModal(false)}
      />
    </>
  );
};

export default Navbar;
