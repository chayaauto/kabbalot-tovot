import { useEffect, useState, useCallback } from 'react';
import { sb } from '../lib/supabase.js';
import { hebLong, hebDay, hebMonth, parshaOf, weekStart, parse, iso, cutoff, whenLabel } from '../lib/dates.js';

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

export default function DrawCard({ draw, compact = false }) {
  return (
    <section className="draw" aria-labelledby="draw-title">
      <div className="draw-band" id="draw-title">ההגרלה הבאה</div>
      <div className="draw-body">
        {draw === undefined && <p className="muted" style={{ gridColumn: '1 / -1' }}>טוענת…</p>}
        {draw === null && (
          <p className="muted" style={{ gridColumn: '1 / -1' }}>ההגרלה הבאה עוד לא נקבעה. נעדכן כאן בקרוב.</p>
        )}
        {draw && (
          <>
            <div className="cal" aria-hidden="true">
              <div className="m">{hebMonth(draw.draw_date)}</div>
              <div className="d">{hebDay(draw.draw_date)}</div>
              <div className="w">יום שני</div>
            </div>
            <div className="draw-meta">
              <span className="countdown">{whenLabel(draw.draw_date)}</span>
              <div className="prize">{draw.prize}</div>
              <div className="muted">
                {hebLong(draw.draw_date)} · שבוע {parshaOf(iso(weekStart(parse(draw.draw_date))))}
              </div>
              {draw.notes && <p>{draw.notes}</p>}
              {!compact && (
                <p className="muted small">
                  נספרים כל השבועות שעוד לא נכנסו להגרלה, עד שבוע {parshaOf(cutoff(draw.draw_date))} (כולל).
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
