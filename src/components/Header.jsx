import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Emblem from './Emblem.jsx';

export default function Header() {
  const { user, isAdmin, displayName, signOut } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const initial = (displayName || '').trim().charAt(0);

  return (
    <header className="site-header">
      <div className="inner">
        <Link to={user ? '/' : '/login'} className="brand">
          <Emblem size={40} />
          <span className="brand-text">
            <span className="name">קבלות טובות לישועה</span>
            <span className="tag">כל שבת שמקיימים, כרטיס להגרלה</span>
          </span>
        </Link>
        <nav className="nav" aria-label="ניווט ראשי">
          {user ? (
            <>
              <NavLink to="/" end>השבתות שלי</NavLink>
              {isAdmin && <NavLink to="/admin">ניהול</NavLink>}
              <span className="user-chip">
                <span className="avatar" aria-hidden="true">{initial}</span>
                <span className="user-name">{displayName}</span>
              </span>
              <button type="button" className="nav-out" onClick={logout}>יציאה</button>
            </>
          ) : (
            <NavLink to="/login">כניסה</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
