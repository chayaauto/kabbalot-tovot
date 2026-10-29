import { useEffect, useRef } from 'react';
import { shabbatLabel, hebDayMonth, weekEnd } from '../lib/dates.js';
import { KABBALOT } from '../lib/kabbalot.js';

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

// Slide-out side panel with the member's own Shabbatot: summary on a wine band, then a timeline.
export default function MyPanel({ open, onClose, weeks, mine, items = [], inDraw }) {
  const panel = useRef(null);
  const closeBtn = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    closeBtn.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      // keep focus inside the panel
      const f = [...panel.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const kept = mine.length;
  const shown = weeks.length;
  const keptShown = weeks.filter((w) => mine.some((p) => p.week_start === w)).length;
  const pct = shown ? Math.round((keptShown / shown) * 100) : 0;
  const perItem = Object.fromEntries(KABBALOT.map((k) => [k.id, items.filter((i) => i.item === k.id).length]));
  const anyItems = items.length > 0;
  const itemsIn = (w) => items.filter((i) => i.week_start === w).length;

  return (
    <div className={`drawer-root${open ? ' open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside ref={panel} className="drawer" role="dialog" aria-modal="true" aria-labelledby="my-panel-title">
        <header className="drawer-head">
          <div className="drawer-title">
            <span className="drawer-kicker">השבתות והכרטיסים שלי</span>
            <h2 id="my-panel-title">מעקב אישי</h2>
          </div>
          <button ref={closeBtn} type="button" className="drawer-close" onClick={onClose} aria-label="סגירת הפאנל"><IconClose /></button>
          <div className="drawer-stats">
            <div className="ds gold"><b className="num">{inDraw}</b><span>כרטיסים בהגרלה הקרובה</span></div>
            <div className="ds"><b className="num">{kept}</b><span>שבתות שקיימתי מאז ההתחלה</span></div>
          </div>
          <div className="drawer-progress" aria-label={`קיימתי ${keptShown} מתוך ${shown} שבתות מאז שהצטרפתי`}>
            <div className="dp-bar"><span style={{ width: `${pct}%` }} /></div>
            <span className="dp-text num">{keptShown} מתוך {shown} שבתות מאז שהצטרפתי</span>
          </div>
        </header>

        <div className="drawer-body">
          <section className="my-k" aria-labelledby="my-k-title">
            <h3 id="my-k-title">הקבלות שקיימתי</h3>
            {anyItems ? (
              <ul>
                {KABBALOT.map((k) => {
                  const n = perItem[k.id];
                  const w = kept ? Math.round((n / kept) * 100) : 0;
                  return (
                    <li key={k.id} className={n ? '' : 'zero'}>
                      <span className="mk-label" title={k.full}>{k.short}</span>
                      <span className="mk-bar" aria-hidden="true"><span style={{ width: `${w}%` }} /></span>
                      <span className="mk-n num" aria-label={`${n} שבתות`}>{n}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted small">אחרי שמסמנים V על השבת, אפשר לסמן גם אילו קבלות קיימת, והסיכום יופיע כאן.</p>
            )}
          </section>

          <h3 className="tl-title">השבתות שלי</h3>
          <div className="legend" aria-hidden="true">
            <span><i className="lg yes" />ממתין להגרלה</span>
            <span><i className="lg used" />נכנס להגרלה</span>
            <span><i className="lg no" />לא סומן</span>
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
                    <span className="sl-date muted">{hebDayMonth(weekEnd(w))}{itemsIn(w) ? ` · ${itemsIn(w) === 1 ? 'קבלה אחת' : `${itemsIn(w)} קבלות`}` : ''}</span>
                  </span>
                  <span className={`pill ${status.cls}`}>{status.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
