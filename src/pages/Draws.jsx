import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase.js';
import { hebLong } from '../lib/dates.js';
import DrawCard, { useNextDraw } from '../components/DrawCard.jsx';

export default function Draws() {
  const [draw] = useNextDraw();
  const [past, setPast] = useState(undefined);

  useEffect(() => {
    sb.from('draws').select('id, draw_date, prize, winner_name, total_entries')
      .eq('status', 'done').order('draw_date', { ascending: false }).limit(50)
      .then(({ data }) => setPast(data || []));
  }, []);

  return (
    <main>
      <div className="page-title">
        <h1>הגרלות</h1>
        <p className="muted">ההגרלה הקרובה והזוכות בהגרלות הקודמות.</p>
      </div>
      <DrawCard draw={draw} />
      <section className="card">
        <h2>הגרלות שנערכו</h2>
        {past === undefined && <p className="muted">טוענת…</p>}
        {past?.length === 0 && <p className="muted">עוד לא נערכו הגרלות. הזוכה הראשונה תופיע כאן.</p>}
        {past?.length > 0 && (
          <ul className="list">
            {past.map((p) => (
              <li key={p.id}>
                <span><b>{p.winner_name || '—'}</b> <span className="muted">זכתה ב{p.prize}</span></span>
                <span className="muted small num">{hebLong(p.draw_date)} · {p.total_entries ?? 0} כרטיסים</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
