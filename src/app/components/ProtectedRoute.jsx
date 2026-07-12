import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <Spinner text="جاري التحقق من الهوية..." />;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}
