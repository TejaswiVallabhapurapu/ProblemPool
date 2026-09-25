import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import GlassAiButton from './GlassAiButton';
import {
  LayoutDashboard,
  HelpCircle,
  Users,
  Trophy,
  Award,
  Bookmark,
  Bell,
  User,
  Shield,
  LogOut,
  PlusCircle,
  Menu,
  X,
} from 'lucide-react';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
      isActive
        ? 'text-white bg-white/10 border border-white/15 font-bold shadow-xs'
        : 'text-[#D1D5DB] hover:text-white hover:bg-white/5'
    }`;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Problems', path: '/problems', icon: HelpCircle },
    { name: 'Team Up', path: '/team-up', icon: Users, badge: '🤝' },
    { name: 'Challenges', path: '/challenges', icon: Trophy, badge: '🧩' },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award, badge: '🏆' },
    { name: 'Saved', path: '/saved-problems', icon: Bookmark, badge: '🔖' },
  ];

  const secondaryNavItems = [
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* MOBILE TOP BAR (md:hidden) */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-16 bg-[#090909]/90 backdrop-blur-xl border-b border-white/15 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-white hover:bg-[#181818] border border-white/10 focus:outline-none transition cursor-pointer"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Problem<span className="text-slate-300">Pool</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
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
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center text-white shadow-md group-hover:border-white/30 group-hover:scale-105 transition-all duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Problem<span className="text-slate-300">Pool</span>
              </span>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181818]"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action: Post Problem Button */}
          <div className="mb-5">
            <GlassAiButton
              to="/create-problem"
              onClick={() => setMobileOpen(false)}
              size="sm"
              variant="primary"
              fullWidth
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Post a Problem
            </GlassAiButton>
          </div>

          {/* Primary Navigation Menu */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
              Explore & Solve
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-300" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-xs">{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          {/* Secondary Account Navigation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
              Account & Workspace
            </div>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-300" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin Dashboard if applicable */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-[#221212] text-rose-300 hover:bg-[#2e1616] border border-rose-500/30 transition shadow-xs"
              >
                <Shield className="w-4 h-4 shrink-0 text-rose-400" />
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
            className="flex items-center gap-3 p-2 rounded-xl bg-[#141414] border border-white/10 hover:border-white/20 transition group"
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-white/5 hover:border-rose-900/30 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
