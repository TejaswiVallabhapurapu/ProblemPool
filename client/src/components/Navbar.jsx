import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from './AnimatedButton';
import GlassAiButton from './GlassAiButton';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard,
  Layers,
  Bookmark,
  Trophy,
  Award,
  Bell,
  User,
  Shield,
  PlusCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import '@designcodeio/threeui/style.css';

/**
 * Custom hook implementing ThreeUI AnimatedTopDock physics controller
 * Configuration: variant="sable", proximity=122, spring=0.19, damping=0.70, widthGrowth=17, heightGrowth=16, drop=3.5
 */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

function useAnimatedTopDock(navRef, options = {}) {
  const optionsRef = useRef({
    variant: 'sable',
    proximity: 122,
    spring: 0.19,
    damping: 0.7,
    widthGrowth: 17,
    heightGrowth: 16,
    drop: 3.5,
    ...options,
  });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const config = optionsRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = window.matchMedia('(hover:hover) and (pointer:fine)');

    let isEnabled = false;
    let isPointerOver = false;
    let isDirty = false;
    let rafId = 0;

    const checkEnabled = () =>
      !prefersReducedMotion.matches &&
      nav.clientWidth > 0 &&
      window.innerWidth > 640 &&
      canHover.matches;

    const getItems = () =>
      Array.from(nav.querySelectorAll('[data-dock-item]')).map((el) => ({
        element: el,
        baseWidth: 0,
        baseHeight: 0,
        value: 0,
        velocity: 0,
        target: 0,
      }));

    let items = getItems();

    const measure = () => {
      isEnabled = checkEnabled();
      items = getItems();

      for (const item of items) {
        item.element.style.width = '';
        item.element.style.height = '';
        item.element.style.transform = '';
        item.element.dataset.dockNear = 'false';
      }

      for (const item of items) {
        const rect = item.element.getBoundingClientRect();
        item.baseWidth = rect.width;
        item.baseHeight = rect.height;
        item.value = 0;
        item.velocity = 0;
        item.target = 0;
      }

      isPointerOver = false;
      isDirty = false;
      nav.dataset.dockState = isEnabled ? 'idle' : 'static';
      nav.dataset.dockMax = '0.00';
    };

    const handlePointerMove = (e) => {
      if (!isEnabled) return;
      const clientX = e.clientX;
      const rects = items.map((i) => i.element.getBoundingClientRect());

      for (let i = 0; i < items.length; i++) {
        const r = rects[i];
        const center = r.left + r.width * 0.5;
        const dist = Math.abs(clientX - center);
        const norm = clamp(1 - dist / Math.max(1, config.proximity), 0, 1);
        const eased = norm * norm * (3 - 2 * norm);
        items[i].target = eased;
        items[i].element.dataset.dockNear = eased > 0.08 ? 'true' : 'false';
      }

      isPointerOver = true;
      isDirty = true;
      nav.dataset.dockState = 'active';
    };

    const handlePointerLeave = () => {
      isPointerOver = false;
      isDirty = true;
      items.forEach((item) => {
        item.target = 0;
        item.element.dataset.dockNear = 'false';
      });
    };

    const applyStyles = () => {
      for (const item of items) {
        const val = clamp(item.value, 0, 1.08);
        const widthGrowth = Math.min(config.widthGrowth, item.baseWidth * 0.24);
        item.element.style.width = `${(item.baseWidth + widthGrowth * val).toFixed(2)}px`;
        item.element.style.height = `${(item.baseHeight + config.heightGrowth * val).toFixed(2)}px`;
        item.element.style.transform = `translateY(${(val * config.drop).toFixed(2)}px)`;
      }
    };

    const tick = () => {
      if (isEnabled && isDirty) {
        let hasActiveDelta = false;
        let maxVal = 0;

        for (const item of items) {
          item.velocity += (item.target - item.value) * config.spring;
          item.velocity *= config.damping;
          item.value += item.velocity;

          if (Math.abs(item.target - item.value) < 1e-3 && Math.abs(item.velocity) < 1e-3) {
            item.value = item.target;
            item.velocity = 0;
          } else {
            hasActiveDelta = true;
          }
          maxVal = Math.max(maxVal, clamp(item.value, 0, 1.08));
        }

        applyStyles();
        nav.dataset.dockMax = maxVal.toFixed(2);

        if (!hasActiveDelta) {
          isDirty = false;
          if (items.every((i) => i.target === 0)) {
            nav.dataset.dockState = 'idle';
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const handleWindowPointerMove = (e) => {
      if (!isPointerOver) return;
      const navRect = nav.getBoundingClientRect();
      const bottom = Math.max(navRect.bottom, ...items.map((i) => i.element.getBoundingClientRect().bottom));
      if (
        e.clientX < navRect.left ||
        e.clientX > navRect.right ||
        e.clientY < navRect.top ||
        e.clientY > bottom + 25
      ) {
        handlePointerLeave();
      }
    };

    const ro = new ResizeObserver(measure);
    ro.observe(nav.parentElement || nav);
    nav.addEventListener('pointermove', handlePointerMove);
    nav.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });

    measure();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      nav.removeEventListener('pointermove', handlePointerMove);
      nav.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointermove', handleWindowPointerMove);
    };
  }, []);
}

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dockRef = useRef(null);

  // Initialize AnimatedTopDock physics controller
  useAnimatedTopDock(dockRef, {
    variant: 'sable',
    proximity: 122,
    spring: 0.19,
    damping: 0.7,
    widthGrowth: 17,
    heightGrowth: 16,
    drop: 3.5,
  });

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

  // Dock items configured according to actual routes
  const authenticatedNavItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      exact: true,
      isActive: location.pathname === '/dashboard' || location.pathname === '/',
    },
    {
      to: '/problems',
      label: 'Problems',
      icon: <Layers className="w-3.5 h-3.5" />,
      isActive: location.pathname.startsWith('/problems') || location.pathname.startsWith('/problem/'),
    },
    {
      to: '/saved-problems',
      label: 'Saved',
      icon: <Bookmark className="w-3.5 h-3.5" />,
      isActive: location.pathname === '/saved-problems',
    },
    {
      to: '/challenges',
      label: 'Challenges',
      icon: <Trophy className="w-3.5 h-3.5" />,
      isActive: location.pathname === '/challenges',
    },
    {
      to: '/leaderboard',
      label: 'Leaderboard',
      icon: <Award className="w-3.5 h-3.5" />,
      isActive: location.pathname === '/leaderboard',
    },
  ];

  const publicNavItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      exact: true,
      isActive: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      to: '/problems',
      label: 'Problems',
      icon: <Layers className="w-3.5 h-3.5" />,
      isActive: location.pathname.startsWith('/problems') || location.pathname.startsWith('/problem/'),
    },
    {
      to: '/challenges',
      label: 'Challenges',
      icon: <Trophy className="w-3.5 h-3.5" />,
      isActive: location.pathname === '/challenges',
    },
    {
      to: '/leaderboard',
      label: 'Leaderboard',
      icon: <Award className="w-3.5 h-3.5" />,
      isActive: location.pathname === '/leaderboard',
    },
  ];

  const currentNavItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
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
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Problem<span className="text-indigo-600">Pool</span>
            </span>
          </Link>

          {/* ThreeUI AnimatedTopDock Navigation (Desktop & Tablet) */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-2">
            <div className="shader-frame">
              <nav
                ref={dockRef}
                className="animated-top-dock__nav"
                aria-label="ProblemPool Top Dock Navigation"
                data-dock-state="idle"
                data-dock-max="0.00"
              >
                {currentNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    data-dock-item
                    data-dock-active={item.isActive ? 'true' : 'false'}
                    className={({ isActive }) =>
                      `animated-top-dock__item ${isActive || item.isActive ? 'active' : ''}`
                    }
                  >
                    <span className="animated-top-dock__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Action Elements */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <NotificationBell />

                {/* Post Problem Button */}
                <GlassAiButton
                  to="/create-problem"
                  size="sm"
                  variant="primary"
                  icon={<PlusCircle className="w-4 h-4" />}
                >
                  Post Problem
                </GlassAiButton>

                {/* Admin Dashboard link if user has admin role */}
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all shadow-xs"
                    title="Admin Dashboard"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </NavLink>
                )}

                {/* Profile Avatar Badge */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition group"
                  title="View Profile & Reputation"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate group-hover:text-indigo-600">
                    {user?.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <GlassAiButton
                  onClick={handleLogout}
                  size="xs"
                  variant="glass"
                  className="!text-slate-500 hover:!text-rose-600"
                  title="Sign out of your account"
                >
                  Logout
                </GlassAiButton>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                {/* Modern Animated Login Button (Preserved existing design) */}
                <AnimatedButton to="/login" variant="login" size="sm">
                  Login
                </AnimatedButton>

                {/* Modern Animated Sign Up Button (Preserved existing design) */}
                <AnimatedButton to="/signup" variant="signup" size="sm">
                  Sign Up
                </AnimatedButton>

                {/* Post Problem Action */}
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

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-2 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <NavLink
            to={isAuthenticated ? '/dashboard' : '/'}
            end
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/problems"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Problems</span>
          </NavLink>
          <NavLink
            to="/challenges"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Weekly Challenges</span>
          </NavLink>
          <NavLink
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Leaderboard</span>
          </NavLink>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <NavLink
                to="/saved-problems"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Bookmark className="w-4 h-4 text-indigo-500" />
                <span>Saved Problems</span>
              </NavLink>

              <NavLink
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </NavLink>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name}
                  <span className="block text-[11px] text-indigo-600 font-normal">View Community Profile →</span>
                </div>
              </Link>

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
                >
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>Admin Dashboard</span>
                </NavLink>
              )}

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
                className="mt-2 text-left justify-start"
                icon={<LogOut className="w-4 h-4" />}
              >
                Logout
              </GlassAiButton>
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
