import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // you could return a spinner here
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}
