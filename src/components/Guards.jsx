import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const Loading = () => <div className="loading">טוענת…</div>;

// Pages for signed-in members only.
export function RequireAuth({ children }) {
  const { loading, user } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

// Admin pages: only the e-mails in the database's admin list.
export function RequireAdmin({ children }) {
  const { loading, user, isAdmin } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// Login and sign-up pages: a signed-in member goes straight home.
export function GuestOnly({ children }) {
  const { loading, user, recovery } = useAuth();
  if (loading) return <Loading />;
  if (user && !recovery) return <Navigate to="/" replace />;
  return children;
}
