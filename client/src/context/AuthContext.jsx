import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const normalizeUser = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  let target = raw;
  if (target.data && typeof target.data === 'object') {
    target = target.data;
  }
  if (target.user && typeof target.user === 'object') {
    target = target.user;
  }
  if (!target || typeof target !== 'object') return null;
  if (!target._id && !target.name && !target.email && !target.username) return null;
  return {
    _id: target._id ? String(target._id) : '',
    name: target.name ? String(target.name) : '',
    email: target.email ? String(target.email) : '',
    username: target.username ? String(target.username) : '',
    role: target.role ? String(target.role) : 'user',
    avatar: target.avatar ? String(target.avatar) : '',
    reputation: typeof target.reputation === 'number' ? target.reputation : (Number(target.reputation) || 0),
  };
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('problempool_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('problempool_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      return normalizeUser(parsed);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate or sync user state on app initialization if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('problempool_token');
      if (storedToken) {
        try {
          const res = await getCurrentUser(storedToken);
          const raw = res?.user || res?.data?.user || res?.data || res;
          const cleanUser = normalizeUser(raw);
          if (res && res.success && cleanUser) {
            setUser(cleanUser);
            localStorage.setItem('problempool_user', JSON.stringify(cleanUser));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    initializeAuth();

    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const signup = async (userData) => {
    return await signupUser(userData);
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const cleanUser = normalizeUser(data?.user || data?.data?.user || data?.data || data);
    if (data?.success && data?.token && cleanUser) {
      setToken(data.token);
      setUser(cleanUser);
      localStorage.setItem('problempool_token', data.token);
      localStorage.setItem('problempool_user', JSON.stringify(cleanUser));
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('problempool_token');
    localStorage.removeItem('problempool_user');
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
