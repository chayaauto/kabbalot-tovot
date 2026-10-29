import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import Message from '../components/Message.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) { setMsg({ text: 'יש למלא שם מלא.' }); return; }
    if (form.password.length < 6) { setMsg({ text: 'הסיסמה צריכה להיות באורך 6 תווים לפחות.' }); return; }
    if (form.password !== form.confirm) { setMsg({ text: 'שתי הסיסמאות לא זהות.' }); return; }
    setBusy(true);
    const { data, error } = await sb.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.name.trim() },
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
      },
    });
    setBusy(false);
    if (error) { setMsg({ text: heError(error) }); return; }
    // Supabase returns a user with no identities when the address is already registered
    if (data.user && data.user.identities?.length === 0) {
      setMsg({ text: 'הכתובת הזאת כבר רשומה. אפשר להיכנס, או לאפס סיסמה אם שכחת.' });
      return;
    }
    if (data.session) navigate('/', { replace: true });
    else navigate('/login?registered=1', { replace: true });
  }

  return (
    <AuthLayout>
      <div className="page-title">
        <h1>הרשמה</h1>
        <p className="muted">פותחות חשבון פעם אחת, ומסמנות בכל שבוע.</p>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="name">שם מלא
          <input id="name" type="text" required autoComplete="name" placeholder="כפי שיופיע בהגרלה"
            value={form.name} onChange={set('name')} />
        </label>
        <label htmlFor="email">אימייל
          <input id="email" type="email" required autoComplete="email" dir="ltr"
            value={form.email} onChange={set('email')} />
        </label>
        <div className="row">
          <label htmlFor="password">סיסמה
            <input id="password" type="password" required minLength={6} autoComplete="new-password" dir="ltr"
              value={form.password} onChange={set('password')} />
          </label>
          <label htmlFor="confirm">אימות סיסמה
            <input id="confirm" type="password" required minLength={6} autoComplete="new-password" dir="ltr"
              value={form.confirm} onChange={set('confirm')} />
          </label>
        </div>
        <p className="muted small">לפחות 6 תווים.</p>
        <Message msg={msg} />
        <button className="btn block" type="submit" disabled={busy}>{busy ? 'נרשמת…' : 'יצירת חשבון'}</button>
      </form>
      <p className="auth-switch">כבר יש לך חשבון? <Link to="/login">לכניסה</Link></p>
    </AuthLayout>
  );
}
