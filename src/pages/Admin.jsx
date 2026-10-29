import { useEffect, useState, useCallback } from 'react';
import { sb } from '../lib/supabase.js';
import { heError } from '../lib/errors.js';
import { parse, iso, addDays, weekStart, markable, cutoff, hebLong, parshaOf, daysUntil, nextMonday } from '../lib/dates.js';

// The next 26 Mondays, labelled in Hebrew, for choosing the draw date.
function mondayOptions(current) {
  const first = parse(nextMonday());
  const list = Array.from({ length: 26 }, (_, i) => iso(addDays(first, 7 * i)));
  if (current && !list.includes(current)) list.unshift(current);
  return list.map((d) => ({ value: d, label: `${hebLong(d)} · שבוע ${parshaOf(iso(weekStart(parse(d))))}` }));
}
import { useNextDraw } from '../components/DrawCard.jsx';
import Message from '../components/Message.jsx';

function DrawForm({ draw, onSaved }) {
  const [form, setForm] = useState({ date: '', prize: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (draw === undefined) return;
    setForm(draw
      ? { date: draw.draw_date, prize: draw.prize, notes: draw.notes || '' }
      : { date: nextMonday(), prize: '', notes: '' });
  }, [draw]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.date || parse(form.date).getDay() !== 1) {
      setMsg({ text: 'ההגרלה נערכת ביום שני. יש לבחור תאריך של יום שני.' }); return;
    }
    setBusy(true);
    const row = { draw_date: form.date, prize: form.prize.trim(), notes: form.notes.trim() || null };
    const { error } = draw
      ? await sb.from('draws').update(row).eq('id', draw.id)
      : await sb.from('draws').insert(row);
    setBusy(false);
    if (error) { setMsg({ text: heError(error) }); return; }
    setMsg({ kind: 'ok', text: 'נשמר. כל המשתתפות רואות עכשיו את ההגרלה המעודכנת.' });
    onSaved();
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{draw ? 'עריכת ההגרלה הבאה' : 'הגדרת ההגרלה הבאה'}</h2>
      <div className="row">
        <label htmlFor="draw-date">תאריך ההגרלה (יום שני)
          <select id="draw-date" required value={form.date} onChange={set('date')}>
            {mondayOptions(draw?.draw_date).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label htmlFor="draw-prize">הפרס
          <input id="draw-prize" type="text" required placeholder="למשל: ספר תהילים מהודר" value={form.prize} onChange={set('prize')} />
        </label>
      </div>
      <label htmlFor="draw-notes">פרטים נוספים (לא חובה)
        <textarea id="draw-notes" placeholder="מה עוד חשוב שהמשתתפות יידעו" value={form.notes} onChange={set('notes')} />
      </label>
      <Message msg={msg} />
      <div><button className="btn" type="submit" disabled={busy}>{draw ? 'שמירת השינויים' : 'יצירת הגרלה'}</button></div>
    </form>
  );
}

function RunDraw({ draw, tickets, players, onDone }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | running
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState(null);

  async function run() {
    setStage('running'); setMsg(null);
    const { data, error } = await sb.rpc('run_draw', { p_draw_id: draw.id });
    if (error) { setMsg({ text: heError(error) }); setStage('idle'); return; }
    setResult(data); setStage('idle');
    onDone();
  }

  return (
    <section className="card">
      <h2>עריכת ההגרלה</h2>
      {result ? (
        <>
          <div className="winner">
            <div className="muted">הזוכה בהגרלה</div>
            <div className="name">{result.winner_name || '—'}</div>
            <div className="muted small num">מתוך {result.total_entries} כרטיסים</div>
          </div>
          <p className="muted small">עכשיו אפשר להגדיר את ההגרלה הבאה בטופס.</p>
        </>
      ) : !draw ? (
        <p className="muted">קודם צריך להגדיר את ההגרלה הבאה.</p>
      ) : (
        <>
          <p className="muted">
            {players} משתתפות עם {tickets} כרטיסים בסך הכול. כל שבת שסומנה היא כרטיס אחד.
            {daysUntil(draw.draw_date) > 0 && ` ההגרלה מתוכננת ל${hebLong(draw.draw_date)}.`}
          </p>
          {stage === 'confirm' ? (
            <div className="confirm">
              <span>לערוך את ההגרלה על {draw.prize}? אי אפשר לבטל אחרי זה.</span>
              <button type="button" className="btn danger" onClick={run}>כן, להגריל</button>
              <button type="button" className="btn ghost" onClick={() => setStage('idle')}>ביטול</button>
            </div>
          ) : (
            <div>
              <button type="button" className="btn" disabled={!tickets || stage === 'running'} onClick={() => setStage('confirm')}>
                {stage === 'running' ? 'מגרילה…' : 'עריכת ההגרלה עכשיו'}
              </button>
            </div>
          )}
          <Message msg={msg} />
        </>
      )}
    </section>
  );
}

export default function Admin() {
  const [draw, reloadDraw] = useNextDraw();
  const [rows, setRows] = useState(undefined);

  const loadPeople = useCallback(async (d) => {
    const [{ data: people }, { data: parts }] = await Promise.all([
      sb.from('profiles').select('id, full_name'),
      sb.from('participations').select('user_id, week_start, draw_id'),
    ]);
    const cut = d ? cutoff(d.draw_date) : null;
    const tw = markable().week; // the Shabbat members are marking now
    const list = (people || []).map((p) => {
      const m = (parts || []).filter((x) => x.user_id === p.id);
      return {
        id: p.id,
        name: p.full_name || '(ללא שם)',
        week: m.some((x) => x.week_start === tw),
        inDraw: cut ? m.filter((x) => !x.draw_id && x.week_start <= cut).length : 0,
        total: m.length,
      };
    }).sort((a, b) => b.inDraw - a.inDraw || b.total - a.total || a.name.localeCompare(b.name, 'he'));
    setRows(list);
  }, []);

  useEffect(() => { if (draw !== undefined) loadPeople(draw); }, [draw, loadPeople]);

  const refresh = async () => { const d = await reloadDraw(); await loadPeople(d); };
  const tickets = (rows || []).reduce((s, r) => s + r.inDraw, 0);
  const players = (rows || []).filter((r) => r.inDraw > 0).length;
  const markedThisWeek = (rows || []).filter((r) => r.week).length;

  return (
    <main>
      <div className="page-title">
        <h1>ניהול</h1>
        <p className="muted">קביעת ההגרלה והפרס, מעקב אחרי המשתתפות ועריכת ההגרלה.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <DrawForm draw={draw} onSaved={refresh} />
          <section className="card">
            <div className="card-head">
              <h2>המשתתפות</h2>
              <span className="muted small num">{rows ? `${rows.length} רשומות · ${markedThisWeek} סימנו את שבת ${parshaOf(markable().week).replace(/^פרשת /, '')}` : ''}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>שם</th><th>השבת האחרונה</th><th>כרטיסים להגרלה הקרובה</th><th>סך הכול שבתות</th></tr></thead>
                <tbody>
                  {rows === undefined && <tr><td colSpan={4} className="muted">טוענת…</td></tr>}
                  {rows?.length === 0 && <tr><td colSpan={4} className="muted">עוד אין משתתפות רשומות.</td></tr>}
                  {rows?.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td><span className={`pill ${r.week ? 'yes' : 'no'}`}>{r.week ? 'סימנה' : 'עוד לא'}</span></td>
                      <td className="n">{r.inDraw}</td>
                      <td className="n">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div className="stack">
          <RunDraw draw={draw} tickets={tickets} players={players} onDone={refresh} />
        </div>
      </div>
    </main>
  );
}
