import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from './AnimatedButton';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isPlatform = location.pathname === '/' || location.pathname === '/platform';

  return (
    <nav className="sticky top-0 z-50 bg-[#080808]/85 backdrop-blur-[20px] border-b border-white/15 shadow-2xl transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* LEFT: ProblemPool Logo & Brand (Text Only) */}
          <Link
            to={isPlatform ? '/' : isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center group shrink-0"
          >
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-slate-200 transition-colors">
              Problem<span className="text-slate-400">Pool</span>
            </span>
          </Link>

          {/* RIGHT: Public Platform Navigation Links (Text Only) */}
          <div className="hidden md:flex items-center gap-4">
            <AnimatedButton to="/login" variant="login" size="md">
              Sign In
            </AnimatedButton>

            <AnimatedButton to="/signup" variant="signup" size="md">
              Get Started
            </AnimatedButton>
          </div>

          {/* Mobile Menu Text Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 focus:outline-none transition cursor-pointer uppercase tracking-wider"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/15 bg-[#0c0c0c] px-6 pt-3 pb-6 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
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
              Get Started
            </AnimatedButton>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
