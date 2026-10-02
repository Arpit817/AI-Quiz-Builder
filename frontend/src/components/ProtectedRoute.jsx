import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Redirects to /login if no user is logged in.
 * Shows nothing while the auth state is being resolved.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or a full-page spinner if preferred
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
