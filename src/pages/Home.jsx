import { useEffect, useState, useCallback } from 'react';
import { sb } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { heError } from '../lib/errors.js';
import { iso, addDays, weekStart, today, thisWeek, lastWeek, isSunday, weekEnd, hebDayMonth, hebLong, parshaOf, parshaShort, cutoff } from '../lib/dates.js';
import DrawCard, { useNextDraw } from '../components/DrawCard.jsx';
import Message from '../components/Message.jsx';

function MarkButton({ week, label, on, busy, onToggle }) {
  return (
    <button type="button" className="mark" aria-pressed={on} disabled={busy} onClick={() => onToggle(week, on)}>
      <span className="box" aria-hidden="true">✓</span>
      <span>
        <span className="t1">{on ? `סימנתי: השתתפתי ${label}` : `השתתפתי ${label}`} · {parshaOf(week)}</span>
        <span className="t2">
          {hebDayMonth(week)} – {hebDayMonth(weekEnd(week))} · {on ? 'לחיצה נוספת מבטלת את הסימון' : 'לחצי כדי לסמן'}
        </span>
      </span>
    </button>
  );
}

export default function Home() {
  const { user, profile } = useAuth();
  const [draw] = useNextDraw();
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
    setBusy(false);
  }

  const has = (w) => mine.some((p) => p.week_start === w);
  const cut = draw ? cutoff(draw.draw_date) : null;
  const inDraw = cut ? mine.filter((p) => !p.draw_id && p.week_start <= cut).length : 0;
  const weeks = Array.from({ length: 10 }, (_, i) => iso(addDays(weekStart(today()), -7 * (9 - i))));
  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <main>
      <div className="page-title">
        <h1>{firstName ? `שלום, ${firstName}` : 'שלום'}</h1>
        <p className="muted">היום {hebLong(iso(today()))} · השבוע {parshaOf(thisWeek())}</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <h2>הסימון השבועי</h2>
            <MarkButton week={thisWeek()} label="השבוע" on={has(thisWeek())} busy={busy} onToggle={toggle} />
            {isSunday() && (
              <>
                <MarkButton week={lastWeek()} label="בשבוע שעבר" on={has(lastWeek())} busy={busy} onToggle={toggle} />
                <p className="muted small">את השבוע שעבר אפשר לסמן רק עד סוף יום ראשון.</p>
              </>
            )}
            <Message msg={msg} />
          </section>

          <section className="card">
            <h2>השבועות שלי</h2>
            <div className="stats">
              <div className="stat"><b className="num">{inDraw}</b><span className="muted small">כרטיסים בהגרלה הקרובה</span></div>
              <div className="stat"><b className="num">{mine.length}</b><span className="muted small">שבועות שהשתתפתי מאז ההתחלה</span></div>
            </div>
            <div className="weeks">
              {weeks.map((w) => {
                const p = mine.find((x) => x.week_start === w);
                const cls = !p ? '' : p.draw_id ? 'used' : 'on';
                return <span key={w} className={`wk ${cls} num`} title={`${parshaOf(w)}: ${p ? 'השתתפתי' : 'לא סומן'}`}>{parshaShort(w)}</span>;
              })}
            </div>
            <p className="muted small">ירוק: ממתין להגרלה. כחול: כבר נכנס להגרלה שנערכה.</p>
          </section>
        </div>

        <div className="stack">
          <DrawCard draw={draw} />
        </div>
      </div>
    </main>
  );
}
