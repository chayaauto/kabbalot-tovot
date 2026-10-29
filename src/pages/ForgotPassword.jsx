import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import Message from '../components/Message.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { setMsg({ text: heError(error) }); return; }
    setMsg({ kind: 'ok', text: 'אם הכתובת רשומה, נשלח אלייך מייל עם קישור לבחירת סיסמה חדשה.' });
  }

  return (
    <AuthLayout>
      <div className="page-title">
        <h1>שכחתי סיסמה</h1>
        <p className="muted">נשלח אלייך קישור לבחירת סיסמה חדשה.</p>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="email">אימייל
          <input id="email" type="email" required autoComplete="email" dir="ltr"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <Message msg={msg} />
        <button className="btn block" type="submit" disabled={busy}>{busy ? 'שולחת…' : 'שליחת קישור'}</button>
      </form>
      <p className="auth-switch"><Link to="/login">חזרה לכניסה</Link></p>
    </AuthLayout>
  );
}
