import { KABBALOT } from '../lib/kabbalot.js';

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

// The kabbalot of this Shabbat: how many kept each one, and (once she marked V) a tick for what she kept.
// counts: { [id]: n }, total: how many marked V this Shabbat, mine: Set of ids, canPick: may tick now.
export default function KabbalotList({ counts, total, mine, canPick, busy, onToggle }) {
  return (
    <div className="klist">
      <div className="klist-head">
        <h3>הקבלות של השבת</h3>
        <span className="klist-hint">{canPick ? 'מה קיימת? לא חובה לסמן' : 'כמה קיימו כל קבלה'}</span>
      </div>
      <ul>
        {KABBALOT.map((k) => {
          const n = counts?.[k.id] ?? 0;
          const pct = total ? Math.min(100, Math.round((n / total) * 100)) : 0;
          const on = mine.has(k.id);
          const body = (
            <>
              <span className="k-bar" style={{ width: `${pct}%` }} aria-hidden="true" />
              {canPick && <span className="k-box" aria-hidden="true"><Check /></span>}
              <span className="k-label" title={k.full}>
                <span className="k-full">{k.full}</span>
                <span className="k-short">{k.short}</span>
              </span>
              <span className="k-n num" aria-label={`${n} קיימו`}>{counts ? n : '–'}</span>
            </>
          );
          return (
            <li key={k.id}>
              {canPick ? (
                <button type="button" className={`krow pick${on ? ' on' : ''}`} aria-pressed={on} disabled={busy} onClick={() => onToggle(k.id, on)}>{body}</button>
              ) : (
                <div className="krow">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
