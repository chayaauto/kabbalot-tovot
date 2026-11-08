import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import { USERNAME_RE, normalizeUsername, usernameToEmail } from '../lib/username.js';
import Message from '../components/Message.jsx';
import AuthLayout from './AuthLayout.jsx';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ fullName: '', username: '', password: '' });
  const loc = useLocation();
  const signup = mode === 'signup';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function switchMode() { setMode(signup ? 'login' : 'signup'); setMsg(null); }

  async function google() {
    setBusy(true); setMsg(null);
    const back = loc.state?.from || '/';
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${back}`, queryParams: { prompt: 'select_account' } },
    });
    if (error) { setMsg({ text: heError(error) }); setBusy(false); }
    // on success the browser leaves for Google and comes back signed in
  }

  async function submit(e) {
    e.preventDefault();
    const username = normalizeUsername(form.username);
    const fullName = form.fullName.trim();
    if (signup && !fullName) return setMsg({ text: 'יש למלא שם מלא.' });
    if (signup && !USERNAME_RE.test(username))
      return setMsg({ text: 'שם המשתמש צריך להיות 3–30 תווים: אותיות באנגלית, מספרים, _ או -.' });
    if (form.password.length < 6) return setMsg({ text: 'הסיסמה צריכה להיות באורך 6 תווים לפחות.' });

    setBusy(true); setMsg(null);
    const email = usernameToEmail(username);
    const { data, error } = signup
      ? await sb.auth.signUp({ email, password: form.password, options: { data: { full_name: fullName } } })
      : await sb.auth.signInWithPassword({ email, password: form.password });
    setBusy(false);
    if (error) return setMsg({ text: heError(error) });
    if (signup && !data.session) setMsg({ text: 'נרשמת, אבל הכניסה לא הושלמה. יש לפנות למנהלת.' });
    // on success the auth listener moves the user into the site
  }

  return (
    <AuthLayout>
      <div className="page-title">
        <h2>{signup ? 'הרשמה לאתר' : 'כניסה לאתר'}</h2>
        <p className="muted">{signup ? 'בוחרות שם משתמש וסיסמה, או נרשמות עם Google.' : 'נכנסות עם שם משתמש וסיסמה, או עם חשבון Google.'}</p>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        {signup && (
          <label htmlFor="full-name">שם מלא
            <input id="full-name" type="text" autoComplete="name" placeholder="כפי שיופיע בהגרלה"
                   value={form.fullName} onChange={set('fullName')} />
          </label>
        )}
        <label htmlFor="username">שם משתמש
          <input id="username" type="text" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck="false"
                 placeholder={signup ? 'אותיות באנגלית ומספרים' : ''} value={form.username} onChange={set('username')} />
        </label>
        <label htmlFor="password">סיסמה
          <input id="password" type="password" dir="ltr" autoComplete={signup ? 'new-password' : 'current-password'}
                 value={form.password} onChange={set('password')} />
        </label>
        <Message msg={msg} />
        <button type="submit" className="btn block" disabled={busy}>
          {busy ? 'רגע…' : signup ? 'הרשמה' : 'כניסה'}
        </button>
      </form>
      <div className="auth-or" aria-hidden="true">או</div>
      <button type="button" className="btn block google-btn" onClick={google} disabled={busy}>
        <GoogleIcon />
        {signup ? 'הרשמה עם Google' : 'כניסה עם Google'}
      </button>
      <p className="muted small auth-switch">
        {signup ? 'כבר רשומה? ' : 'עוד לא רשומה? '}
        <button type="button" className="link-btn" onClick={switchMode}>{signup ? 'לכניסה' : 'להרשמה'}</button>
      </p>
    </AuthLayout>
  );
}
