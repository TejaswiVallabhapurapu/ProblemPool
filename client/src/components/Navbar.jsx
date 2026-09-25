import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from './AnimatedButton';
import GlassAiButton from './GlassAiButton';
import NotificationBell from './NotificationBell';
import { PlusCircle, Shield, LogOut } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is the public Platform landing page
  const isPlatform = location.pathname === '/' || location.pathname === '/platform';

  // High-contrast, spacious, premium typography styling for nav items
  const navLinkClass = ({ isActive }) =>
    `font-semibold text-sm transition-all duration-200 px-3.5 py-1.5 rounded-xl whitespace-nowrap ${
      isActive
        ? 'text-white bg-white/10 border border-white/20 font-bold shadow-xs'
        : 'text-[#E5E5E5] hover:text-white hover:bg-white/5'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handlePostProblemClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login', {
        state: { message: 'Please sign in to post a problem', from: '/create-problem' },
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#080808]/85 backdrop-blur-[20px] border-b border-white/15 shadow-2xl transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* LEFT: ProblemPool Logo & Brand */}
          <Link
            to={isPlatform ? '/' : isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center space-x-3 group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center text-white shadow-md group-hover:border-white/30 group-hover:scale-105 transition-all duration-200">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-slate-200 transition-colors">
              Problem<span className="text-slate-300">Pool</span>
            </span>
          </Link>

          {/* RIGHT: Desktop Navigation Links & Action Controls */}
          {isPlatform ? (
            /* 1. PUBLIC PLATFORM NAVBAR: Minimal (Sign In | Get Started) */
            <div className="hidden md:flex items-center gap-4">
              <AnimatedButton to="/login" variant="login" size="md">
                Sign In
              </AnimatedButton>

              <AnimatedButton to="/signup" variant="signup" size="md">
                Get Started →
              </AnimatedButton>
            </div>
          ) : (
            /* 2. AUTHENTICATED APPLICATION NAVBAR: Spacious & Readable */
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              {/* Core App Navigation Links */}
              <div className="flex items-center gap-1.5 lg:gap-2 mr-2">
                <NavLink to="/dashboard" end className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/problems" className={navLinkClass}>
                  Problems
                </NavLink>
                <NavLink to="/team-up" className={navLinkClass}>
                  🤝 Team Up
                </NavLink>
                <NavLink to="/challenges" className={navLinkClass}>
                  🧩 Challenges
                </NavLink>
                <NavLink to="/leaderboard" className={navLinkClass}>
                  🏆 Leaderboard
                </NavLink>
                {isAuthenticated && (
                  <NavLink to="/saved-problems" className={navLinkClass}>
                    🔖 Saved
                  </NavLink>
                )}
              </div>

              {/* Authenticated Utilities & Actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3 pl-3 border-l border-white/15">
                  {/* Notifications */}
                  <NotificationBell />

                  {/* Post Problem CTA */}
                  <GlassAiButton
                    to="/create-problem"
                    size="sm"
                    variant="primary"
                    icon={<PlusCircle className="w-4 h-4" />}
                  >
                    Post Problem
                  </GlassAiButton>

                  {/* Admin Badge */}
                  {user?.role === 'admin' && (
                    <NavLink
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#221212] text-rose-300 hover:bg-[#2e1616] border border-rose-500/40 text-xs font-bold transition-all shadow-xs"
                      title="Admin Dashboard"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </NavLink>
                  )}

                  {/* Profile Chip */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 pl-1 hover:opacity-90 transition group"
                    title="View Profile & Reputation"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-white/20 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-white max-w-[120px] truncate group-hover:text-slate-200">
                      {user?.name}
                    </span>
                  </Link>

                  {/* Logout Button */}
                  <GlassAiButton
                    onClick={handleLogout}
                    size="xs"
                    variant="glass"
                    className="!text-[#E5E5E5] hover:!text-rose-400"
                    title="Sign out of your account"
                  >
                    Logout
                  </GlassAiButton>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-2">
                  <AnimatedButton to="/login" variant="login" size="sm">
                    Sign In
                  </AnimatedButton>
                  <AnimatedButton to="/signup" variant="signup" size="sm">
                    Sign Up
                  </AnimatedButton>
                  <GlassAiButton
                    to="/create-problem"
                    onClick={handlePostProblemClick}
                    size="sm"
                    variant="glass"
                    icon={<PlusCircle className="w-4 h-4" />}
                  >
                    Post Problem
                  </GlassAiButton>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2.5 rounded-xl text-white hover:bg-[#1c1c1c] border border-white/10 focus:outline-none transition cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/15 bg-[#0c0c0c] px-6 pt-3 pb-6 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {isPlatform ? (
            /* Mobile: Public Platform Options Only */
            <div className="flex flex-col gap-3 pt-2">
              <AnimatedButton
                to="/login"
                variant="login"
                size="md"
                fullWidth
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </AnimatedButton>
              <AnimatedButton
                to="/signup"
                variant="signup"
                size="md"
                fullWidth
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free →
              </AnimatedButton>
            </div>
          ) : isAuthenticated ? (
            /* Mobile: Authenticated Navigation Options */
            <div className="space-y-2">
              <NavLink
                to="/dashboard"
                end
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/problems"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                Problems
              </NavLink>
              <NavLink
                to="/team-up"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                🤝 Team Up
              </NavLink>
              <NavLink
                to="/challenges"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                🧩 Weekly Challenges
              </NavLink>
              <NavLink
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                🏆 Leaderboard
              </NavLink>
              <NavLink
                to="/saved-problems"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                🔖 Saved Problems
              </NavLink>
              <NavLink
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-white hover:bg-[#181818]"
              >
                🔔 Notifications
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-base font-bold text-rose-400 hover:bg-[#221212]"
                >
                  🛡️ Admin Dashboard
                </NavLink>
              )}

              <div className="pt-3 border-t border-white/10 space-y-3">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#161616] border border-white/10 hover:bg-[#1c1c1c] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#202020] border border-white/15 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {user?.name}
                    <span className="block text-[11px] text-slate-400 font-normal">View Community Profile →</span>
                  </div>
                </Link>

                <GlassAiButton
                  to="/create-problem"
                  onClick={() => setMobileMenuOpen(false)}
                  variant="primary"
                  fullWidth
                  icon={<PlusCircle className="w-4 h-4" />}
                >
                  Post Problem
                </GlassAiButton>

                <GlassAiButton
                  onClick={handleLogout}
                  variant="danger"
                  fullWidth
                  className="text-left justify-start"
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </GlassAiButton>
              </div>
            </div>
          ) : (
            /* Mobile: Unauthenticated on Protected/App Route */
            <div className="pt-2 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <AnimatedButton
                  to="/login"
                  variant="login"
                  size="md"
                  fullWidth
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </AnimatedButton>
                <AnimatedButton
                  to="/signup"
                  variant="signup"
                  size="md"
                  fullWidth
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </AnimatedButton>
              </div>

              <GlassAiButton
                to="/create-problem"
                onClick={handlePostProblemClick}
                variant="glass"
                fullWidth
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Post Problem
              </GlassAiButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
