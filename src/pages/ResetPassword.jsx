import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import { useAuth } from '../lib/auth.jsx';
import Message from '../components/Message.jsx';
import AuthLayout from './AuthLayout.jsx';

// Reached from the e-mailed reset link; Supabase signs the member in for this step.
export default function ResetPassword() {
  const { loading, user, clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) { setMsg({ text: 'הסיסמה צריכה להיות באורך 6 תווים לפחות.' }); return; }
    if (password !== confirm) { setMsg({ text: 'שתי הסיסמאות לא זהות.' }); return; }
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMsg({ text: heError(error) }); return; }
    clearRecovery();
    navigate('/', { replace: true });
  }

  return (
    <AuthLayout>
      <div className="page-title">
        <h1>סיסמה חדשה</h1>
        <p className="muted">בחרי סיסמה חדשה לחשבון שלך.</p>
      </div>
      {loading ? <p className="muted">טוענת…</p> : !user ? (
        <>
          <div className="msg err">הקישור לא תקף או שפג תוקפו. אפשר לבקש קישור חדש.</div>
          <Link className="btn block" to="/forgot-password">בקשת קישור חדש</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="password">סיסמה חדשה
            <input id="password" type="password" required minLength={6} autoComplete="new-password" dir="ltr"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label htmlFor="confirm">אימות סיסמה
            <input id="confirm" type="password" required minLength={6} autoComplete="new-password" dir="ltr"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <Message msg={msg} />
          <button className="btn block" type="submit" disabled={busy}>{busy ? 'שומרת…' : 'שמירת הסיסמה'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
