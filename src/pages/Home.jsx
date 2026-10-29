import { useEffect, useState, useCallback } from 'react';
import { sb } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { heError } from '../lib/errors.js';
import { iso, addDays, parse, today, thisWeek, weekStart, weekEnd, hebDayMonth, hebLong, parshaOf, shabbatLabel, cutoff, markable } from '../lib/dates.js';
import DrawCard, { useNextDraw, notifyParticipationChanged, useWeekCount, CountUp } from '../components/DrawCard.jsx';
import Message from '../components/Message.jsx';

function MarkButton({ week, on, busy, onToggle }) {
  return (
    <button type="button" className="mark" aria-pressed={on} disabled={busy} onClick={() => onToggle(week, on)}>
      <span className="box" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
      <span>
        <span className="t1">{on ? 'סימנתי: קיימתי את הקבלה' : 'קיימתי את הקבלה'} ב{shabbatLabel(week)}</span>
        <span className="t2">
          {hebDayMonth(weekEnd(week))} · {on ? 'לחיצה נוספת מבטלת את הסימון' : 'לחצי כדי לסמן'}
        </span>
      </span>
    </button>
  );
}

export default function Home() {
  const { user, profile } = useAuth();
  const [draw] = useNextDraw();
  const weekCount = useWeekCount();
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const { data } = await sb.from('participations').select('week_start, draw_id')
      .eq('user_id', user.id).order('week_start', { ascending: false });
    setMine(data || []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function toggle(week, on) {
    setBusy(true); setMsg(null);
    const { error } = on
      ? await sb.from('participations').delete().eq('user_id', user.id).eq('week_start', week)
      : await sb.from('participations').insert({ user_id: user.id, week_start: week });
    if (error) setMsg({ text: heError(error) });
    else setMsg({ kind: 'ok', text: on ? 'הסימון בוטל.' : 'נרשם. בהצלחה!' });
    await load();
    if (!error) notifyParticipationChanged();
    setBusy(false);
  }

  const has = (w) => mine.some((p) => p.week_start === w);
  const cut = draw ? cutoff(draw.draw_date) : null;
  const inDraw = cut ? mine.filter((p) => !p.draw_id && p.week_start <= cut).length : 0;
  const { week: markWeek, shabbatNow } = markable();
  // Shabbatot from the one before joining (or the earliest marked) up to the one being marked now, newest first
  const joined = profile?.created_at ? iso(addDays(weekStart(new Date(profile.created_at)), -7)) : markWeek;
  const earliest = mine.length ? mine[mine.length - 1].week_start : markWeek;
  const start = [joined, earliest, markWeek].sort()[0];
  const weeks = [];
  for (let w = markWeek; w >= start && weeks.length < 52; w = iso(addDays(parse(w), -7))) weeks.push(w);
  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <main className="page home">
      <section className="welcome">
        <p className="kicker">{hebLong(iso(today()))}</p>
        <h1>{firstName ? `שלום, ${firstName}` : 'שלום'}</h1>
        <p className="muted">השבת הקרובה: <span className="chip">{parshaOf(thisWeek())}</span></p>
      </section>

      <div className="home-grid">
        <div className="stack">
          <section className="card hero" aria-label="הקבלה של השבת">
            <div className="hero-head">
              <div className="hero-count" role="status" aria-label={weekCount == null ? undefined : `${weekCount} כבר השתתפו בקבלה של ${shabbatLabel(markWeek)}`}>
                {weekCount == null ? <b className="num" aria-hidden="true">–</b> : <CountUp value={weekCount} />}
                <span aria-hidden="true">כבר השתתפו בקבלה של {shabbatLabel(markWeek)}</span>
              </div>
            </div>
            {shabbatNow ? (
              <div className="msg ok">שבת שלום! אפשר לסמן את השבת הזאת במוצאי שבת.</div>
            ) : (
              <>
                <MarkButton week={markWeek} on={has(markWeek)} busy={busy} onToggle={toggle} />
                <p className="muted small">מסמנים מצאת השבת ועד יום שישי שאחריה.</p>
              </>
            )}
            <Message msg={msg} />
          </section>

          <DrawCard draw={draw} showWeek={false} />
        </div>

        <aside className="home-side" aria-label="הסטטוס שלי">
          <section className="card side-card">
            <h2>השבתות שלי</h2>
            <div className="stats">
              <div className="stat gold"><b className="num">{inDraw}</b><span>כרטיסים בהגרלה הקרובה</span></div>
              <div className="stat"><b className="num">{mine.length}</b><span>שבתות שקיימתי מאז ההתחלה</span></div>
            </div>
            <ul className="shabbat-list">
              {weeks.map((w) => {
                const p = mine.find((x) => x.week_start === w);
                const status = !p ? { cls: 'no', text: 'לא סומן' }
                  : p.draw_id ? { cls: 'used', text: 'נכנס להגרלה' }
                  : { cls: 'yes', text: 'ממתין להגרלה' };
                return (
                  <li key={w} className={`sl-${status.cls}`}>
                    <span className="sl-dot" aria-hidden="true" />
                    <span className="sl-text">
                      <span className="sl-name">{shabbatLabel(w)}</span>
                      <span className="sl-date muted">{hebDayMonth(weekEnd(w))}</span>
                    </span>
                    <span className={`pill ${status.cls}`}>{status.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
