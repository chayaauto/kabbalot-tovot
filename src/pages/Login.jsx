import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import Message from '../components/Message.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const [msg, setMsg] = useState(() => {
    if (params.get('confirmed')) return { kind: 'ok', text: 'הכתובת אושרה. אפשר להיכנס.' };
    if (params.get('registered')) return { kind: 'ok', text: 'נרשמת בהצלחה. שלחנו קישור אישור למייל שלך; אחרי האישור אפשר להיכנס.' };
    if (params.get('reset')) return { kind: 'ok', text: 'הסיסמה עודכנה. אפשר להיכנס עם הסיסמה החדשה.' };
    return null;
  });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setMsg({ text: heError(error) }); return; }
    navigate(loc.state?.from || '/', { replace: true });
  }

  return (
    <AuthLayout>
      <div className="page-title">
        <h1>כניסה</h1>
        <p className="muted">שמחות שחזרת. הכניסי את פרטי החשבון שלך.</p>
      </div>
      <form onSubmit={submit} noValidate={false}>
        <label htmlFor="email">אימייל
          <input id="email" type="email" required autoComplete="email" dir="ltr"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label htmlFor="password">
          <span className="label-row"><span>סיסמה</span><Link to="/forgot-password">שכחתי סיסמה</Link></span>
          <input id="password" type="password" required autoComplete="current-password" dir="ltr"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Message msg={msg} />
        <button className="btn block" type="submit" disabled={busy}>{busy ? 'נכנסת…' : 'כניסה'}</button>
      </form>
      <p className="auth-switch">עוד אין לך חשבון? <Link to="/signup">להרשמה</Link></p>
    </AuthLayout>
  );
}
