import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from './AnimatedButton';
import NotificationBell from './NotificationBell';
import { Bell } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `font-medium text-sm transition-colors duration-200 ${
      isActive
        ? 'text-indigo-600 font-semibold'
        : 'text-slate-600 hover:text-indigo-600'
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
        state: { message: 'Please log in to post a problem', from: '/create-problem' },
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
              <svg
                className="w-5 h-5"
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
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Problem<span className="text-indigo-600">Pool</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/problems" className={navLinkClass}>
              Problems
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/saved-problems" className={navLinkClass}>
                  🔖 Saved Problems
                </NavLink>

                {/* Notification Bell Dropdown */}
                <NotificationBell />

                <Link
                  to="/create-problem"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm shadow-indigo-200 hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Post Problem</span>
                </Link>

                {/* Profile Link & User badge */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition group"
                  title="View Profile & Reputation"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 max-w-[140px] truncate group-hover:text-indigo-600">
                    {user?.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* Modern Animated Login Button */}
                <AnimatedButton to="/login" variant="login" size="sm">
                  Login
                </AnimatedButton>

                {/* Modern Animated Sign Up Button */}
                <AnimatedButton to="/signup" variant="signup" size="sm">
                  Sign Up
                </AnimatedButton>

                <Link
                  to="/create-problem"
                  onClick={handlePostProblemClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all duration-200 active:scale-95"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Post Problem</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-3">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            Home
          </NavLink>
          <NavLink
            to="/problems"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            Problems
          </NavLink>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name}
                  <span className="block text-[11px] text-indigo-600 font-normal">View Community Profile →</span>
                </div>
              </Link>
              <NavLink
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                🔔 Notifications
              </NavLink>
              <NavLink
                to="/saved-problems"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                🔖 Saved Problems
              </NavLink>
              <Link
                to="/create-problem"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium shadow-sm transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Post Problem</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-600 font-medium text-sm hover:bg-rose-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <AnimatedButton
                  to="/login"
                  variant="login"
                  size="md"
                  fullWidth
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
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

              <Link
                to="/create-problem"
                onClick={handlePostProblemClick}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Post Problem</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
