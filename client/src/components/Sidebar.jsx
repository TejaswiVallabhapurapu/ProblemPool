import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassAiButton from './GlassAiButton';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'text-white bg-white/10 border border-white/15 font-bold shadow-xs'
        : 'text-[#D1D5DB] hover:text-white hover:bg-white/5'
    }`;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', end: true },
    { name: 'Problems', path: '/problems' },
    { name: 'Team Up', path: '/team-up' },
    { name: 'Challenges', path: '/challenges' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Saved', path: '/saved-problems' },
  ];

  const secondaryNavItems = [
    { name: 'Notifications', path: '/notifications' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <>
      {/* MOBILE TOP BAR (md:hidden) - Text only */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-16 bg-[#090909]/90 backdrop-blur-xl border-b border-white/15 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 focus:outline-none transition cursor-pointer tracking-wider uppercase"
            aria-label="Open Sidebar Menu"
          >
            Menu
          </button>

          <Link to="/dashboard" className="text-lg font-black tracking-tight text-white">
            Problem<span className="text-slate-300">Pool</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/notifications"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10"
          >
            Alerts
          </Link>
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-white/20 text-white flex items-center justify-center font-bold text-xs shadow-xs"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Link>
        </div>
      </div>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* DESKTOP FIXED SIDEBAR & MOBILE SLIDE-IN DRAWER */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0a0a]/92 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* TOP SECTION: LOGO & NAV */}
        <div className="flex flex-col flex-1 overflow-y-auto p-5 no-scrollbar">
          {/* Logo & Close Button on Mobile */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="group inline-block"
            >
              <span className="text-xl font-black tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Problem<span className="text-slate-400">Pool</span>
              </span>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden px-2 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-[#181818] border border-white/10"
              aria-label="Close Sidebar"
            >
              Close
            </button>
          </div>

          {/* Quick Action: Post Problem Button (Text Only) */}
          <div className="mb-6">
            <GlassAiButton
              to="/create-problem"
              onClick={() => setMobileOpen(false)}
              size="sm"
              variant="primary"
              fullWidth
            >
              Post a Problem
            </GlassAiButton>
          </div>

          {/* Primary Navigation Menu */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-4 mb-2">
              Explore & Solve
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass}
              >
                <span className="flex-1">{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          {/* Secondary Account Navigation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-4 mb-2">
              Account & Workspace
            </div>
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass}
              >
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Admin Dashboard if applicable */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-2.5 rounded-xl font-bold text-xs bg-[#221212] text-rose-300 hover:bg-[#2e1616] border border-rose-500/30 transition shadow-xs mt-1"
              >
                <span>Admin Dashboard</span>
              </NavLink>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-white/10 bg-[#080808]/80 space-y-3">
          {/* User Preview Link */}
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141414] border border-white/10 hover:border-white/20 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-[#202020] border border-white/15 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-slate-200">
                {user?.name || 'Problem Solver'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                @{user?.username || user?.email?.split('@')[0] || 'solver'}
              </div>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-white/5 hover:border-rose-900/30 transition cursor-pointer"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
