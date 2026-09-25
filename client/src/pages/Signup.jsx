import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KnowledgeNetworkBackground from '../components/KnowledgeNetworkBackground';
import '@designcodeio/threeui/style.css';
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  Info,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Loader } from '../components/Loader';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialNotice, setSocialNotice] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    setServerError('');
    setSocialNotice(null);
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSocialNotice(null);

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Navigate to /login with flash success message
      navigate('/login', {
        state: { successMessage: 'Account created successfully. Please sign in.' },
      });
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = (provider) => {
    setSocialNotice(
      `${provider} registration is currently not configured on this server. Please create your account with email and password.`
    );
    setTimeout(() => {
      setSocialNotice(null);
    }, 6000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic 3D constellation background matching ProblemPool aesthetic */}
      <KnowledgeNetworkBackground variant="constellation" />

      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Main Uiverse Authentication Card */}
        <div className="uiverse-auth-container">
          {/* Centered Large "Sign Up" Heading */}
          <div className="text-center">
            <h1 className="uiverse-heading">Sign Up</h1>
            <p className="mt-1.5 text-xs text-slate-400 font-medium">
              Create your account on <span className="font-bold text-white">ProblemPool</span>
            </p>
          </div>

          {/* Server / Auth Error Notice */}
          {serverError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#201414] border border-red-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          {/* Social Provider Notice */}
          {socialNotice && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#181818] border border-white/15 text-slate-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="font-medium">{socialNotice}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} noValidate className="uiverse-form">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                className={`uiverse-input ${fieldErrors.name ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && (
                <p id="name-error" className="mt-1 text-xs text-rose-600 font-medium px-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`uiverse-input ${fieldErrors.email ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-rose-600 font-medium px-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="•••••••• (min 6 characters)"
                className={`uiverse-input ${fieldErrors.password ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-xs text-rose-600 font-medium px-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`uiverse-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-xs text-rose-600 font-medium px-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Sign Up Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="uiverse-button"
                aria-label="Create ProblemPool Account"
              >
                {loading ? (
                  <>
                    <Loader size="sm" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social Sign Up Section */}
          <div className="uiverse-social-container">
            <div className="uiverse-social-title">
              <span>Or Sign Up with</span>
            </div>

            <div className="uiverse-social-accounts">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Google')}
                className="uiverse-social-button group"
                title="Sign up with Google (Liquid Metal Interactive)"
                aria-label="Sign up with Google"
              >
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Apple')}
                className="uiverse-social-button group"
                title="Apple Sign-Up (Coming Soon)"
                aria-label="Sign up with Apple (Coming Soon)"
              >
                <svg className="w-5 h-5 fill-current text-slate-800 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.62-.75 1.04-1.8 0.92-2.86-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.65-1.23z" />
                </svg>
              </button>

              {/* X / Twitter Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('X')}
                className="uiverse-social-button group"
                title="X / Twitter Sign-Up (Coming Soon)"
                aria-label="Sign up with X (Coming Soon)"
              >
                <svg className="w-4 h-4 fill-current text-slate-800 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Licence Agreement */}
          <p className="uiverse-agreement">
            By signing up, you agree to our{' '}
            <Link to="#" onClick={(e) => e.preventDefault()}>
              User Licence Agreement
            </Link>{' '}
            and Privacy Policy.
          </p>

          {/* Sign Up ↔ Sign In Navigation */}
          <div className="uiverse-footer-nav">
            Already have an account?
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
