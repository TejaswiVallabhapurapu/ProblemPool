import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoaderContainer } from './Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LoaderContainer minHeight="100vh" message="Checking authorization..." />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          message: 'Please log in to access this page.',
          from: location.pathname + location.search,
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
