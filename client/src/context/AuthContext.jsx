import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('problempool_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('problempool_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      const rawUser = parsed?.user || parsed;
      if (rawUser && (rawUser._id || rawUser.name || rawUser.email || rawUser.username)) {
        return {
          _id: rawUser._id || '',
          name: rawUser.name || '',
          email: rawUser.email || '',
          username: rawUser.username || '',
          role: rawUser.role || 'user',
          avatar: rawUser.avatar || '',
          reputation: rawUser.reputation || 0,
        };
      }
      return null;
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
          const raw = res?.user || res?.data?.user || res?.data;
          if (res && res.success && raw) {
            const cleanUser = {
              _id: raw._id || '',
              name: raw.name || '',
              email: raw.email || '',
              username: raw.username || '',
              role: raw.role || 'user',
              avatar: raw.avatar || '',
              reputation: raw.reputation || 0,
            };
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
    const rawUser = data?.user || data?.data?.user || data?.data;
    if (data?.success && data?.token && rawUser) {
      const cleanUser = {
        _id: rawUser._id || '',
        name: rawUser.name || '',
        email: rawUser.email || '',
        username: rawUser.username || '',
        role: rawUser.role || 'user',
        avatar: rawUser.avatar || '',
        reputation: rawUser.reputation || 0,
      };
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
