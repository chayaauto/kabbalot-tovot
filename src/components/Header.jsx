import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Header() {
  const { user, isAdmin, displayName, signOut } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="site-header">
      <div className="inner">
        <Link to={user ? '/' : '/login'} className="brand">
          <span className="brand-mark" aria-hidden="true">ק</span>
          <span className="name">קבלות טובות לישועה</span>
        </Link>
        <nav className="nav" aria-label="ניווט ראשי">
          {user ? (
            <>
              <NavLink to="/" end>הבית שלי</NavLink>
              <NavLink to="/draws">הגרלות</NavLink>
              {isAdmin && <NavLink to="/admin">ניהול</NavLink>}
              <span className="user">{displayName}</span>
              <button type="button" onClick={logout}>יציאה</button>
            </>
          ) : (
            <>
              <NavLink to="/login">כניסה</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
