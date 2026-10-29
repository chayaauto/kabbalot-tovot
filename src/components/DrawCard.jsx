import { useEffect, useState, useCallback, useRef } from 'react';
import { sb } from '../lib/supabase.js';
import { hebLong, hebDay, hebMonth, parshaOf, shabbatLabel, weekStart, parse, iso, cutoff, daysUntil } from '../lib/dates.js';

// The single upcoming draw, readable by everyone (also before login).
export function useNextDraw() {
  const [draw, setDraw] = useState(undefined);
  const reload = useCallback(async () => {
    const { data } = await sb.from('draws').select('*').eq('status', 'upcoming')
      .order('draw_date').limit(1).maybeSingle();
    setDraw(data || null);
    return data || null;
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return [draw, reload];
}

// Pages that change participations call this so the live counters refresh.
export const notifyParticipationChanged = () => window.dispatchEvent(new Event('kabbalot:participation'));

// Live totals (numbers only, no names): tickets in the coming draw and how many took on this Shabbat's kabbala.
function useCounts(draw) {
  const [counts, setCounts] = useState({ tickets: null, week: null });
  const load = useCallback(async () => {
    const [tc, wc] = await Promise.all([
      draw ? sb.rpc('draw_ticket_count') : Promise.resolve({ error: true }),
      sb.rpc('week_participant_count'),
    ]);
    setCounts({ tickets: tc.error ? null : (tc.data ?? 0), week: wc.error ? null : (wc.data ?? 0) });
  }, [draw?.id, draw?.draw_date]);
  useEffect(() => {
    if (draw === undefined) return;
    load();
    window.addEventListener('kabbalot:participation', load);
    return () => window.removeEventListener('kabbalot:participation', load);
  }, [load, draw]);
  return counts;
}

// Just this Shabbat's participant count, refreshed whenever a participation changes.
export function useWeekCount() {
  const [week, setWeek] = useState(null);
  const load = useCallback(async () => {
    const { data, error } = await sb.rpc('week_participant_count');
    setWeek(error ? null : (data ?? 0));
  }, []);
  useEffect(() => {
    load();
    window.addEventListener('kabbalot:participation', load);
    return () => window.removeEventListener('kabbalot:participation', load);
  }, [load]);
  return week;
}

// Rolls from the previous value (0 on first show) up to the new one, easing out.
export function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current, target = value;
    from.current = value;
    setDone(false);
    if (start === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(target); return; }
    const dur = Math.min(2200, 900 + Math.abs(target - start) * 25), t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + e * (target - start)));
      if (k < 1) raf = requestAnimationFrame(step); else setDone(true);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <b className={'num' + (done ? ' done' : '')} aria-hidden="true">{shown.toLocaleString('he-IL')}</b>;
}

function Counts({ tickets, week }) {
  if (tickets == null && week == null) return null;
  return (
    <div className="tk-counts">
      {tickets != null && (
        <div className="tk-count" role="status" aria-label={`${tickets} כרטיסים משתתפים בהגרלה`}>
          <CountUp value={tickets} /><span aria-hidden="true">כרטיסים משתתפים בהגרלה</span>
        </div>
      )}
      {week != null && (
        <div className="tk-count week" role="status" aria-label={`${week} כבר השתתפו בקבלה של השבת`}>
          <CountUp value={week} /><span aria-hidden="true">כבר השתתפו בקבלה של השבת</span>
        </div>
      )}
    </div>
  );
}

export const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21.5 9l-5.3 4.5L18 20.5 12 16.8 6 20.5l1.8-7L2.5 9l6.9-.4z" /></svg>
);
const IconGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
  </svg>
);

function When({ date }) {
  const left = daysUntil(date);
  if (left > 1) return <span className="countdown">עוד <b className="num">{left}</b> ימים</span>;
  if (left === 1) return <span className="countdown now">מחר!</span>;
  if (left === 0) return <span className="countdown now">היום!</span>;
  return <span className="countdown">ממתינה לעריכה</span>;
}

// A raffle ticket: gold stub with the date, a perforation, and the navy body with prize, countdown and live counters.
export default function DrawCard({ draw, compact = false, showWeek = true }) {
  const all = useCounts(draw);
  const counts = showWeek ? all : { ...all, week: null };
  const eyebrow = <span className="eyebrow"><IconStar />ההגרלה הבאה</span>;
  return (
    <section className="draw" aria-label="ההגרלה הבאה">
      {!draw ? (
        <div className="ticket empty">
          <div className="tk-empty">
            {eyebrow}
            <p>{draw === undefined ? 'טוענת…' : 'ההגרלה הבאה עוד לא נקבעה. נעדכן כאן בקרוב.'}</p>
            {draw === null && <Counts {...counts} />}
          </div>
        </div>
      ) : (
        <div className="ticket">
          <div className="stub" aria-hidden="true">
            <div className="m">{hebMonth(draw.draw_date)}</div>
            <div className="d">{hebDay(draw.draw_date)}</div>
            <div className="w">יום שני</div>
          </div>
          <div className="tk-main">
            <div className="tk-top">{eyebrow}<When date={draw.draw_date} /></div>
            <div className="prize-box">
              <span className="prize-ico"><IconGift /></span>
              <div style={{ minWidth: 0 }}>
                <div className="prize-label">הפרס</div>
                <div className="prize">{draw.prize}</div>
              </div>
            </div>
            <Counts {...counts} />
            <div className="tk-date">
              {hebLong(draw.draw_date)} · שבוע {parshaOf(iso(weekStart(parse(draw.draw_date))))}
            </div>
            {draw.notes && <p className="tk-notes">{draw.notes}</p>}
            {!compact && (
              <p className="tk-foot">
                נספרות כל השבתות שעוד לא נכנסו להגרלה, עד {shabbatLabel(cutoff(draw.draw_date))} (כולל).
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
