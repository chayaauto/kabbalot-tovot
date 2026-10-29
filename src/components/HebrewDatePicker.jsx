import { useEffect, useRef, useState } from 'react';
import { HDate, Locale, gematriya } from '@hebcal/core';
import { iso, parse, today } from '../lib/dates.js';

// A date field that opens a Hebrew-calendar month grid (Hebrew day, Gregorian day underneath).
// value / onChange use 'YYYY-MM-DD'. isEnabled(iso) decides which days can be picked.

const DAY_HEADS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const he = (s) => Locale.gettext(s, 'he-x-NoNikud');
const firstOfMonth = (h) => new HDate(1, h.getMonth(), h.getFullYear());
const monthTitle = (h) => `${he(h.getMonthName())} ${gematriya(h.getFullYear())}`;

function monthCells(first) {
  const start = first.greg();
  const cells = Array.from({ length: start.getDay() }, () => null); // blanks before day 1
  for (let i = 0; i < first.daysInMonth(); i++) {
    const g = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ iso: iso(g), heb: gematriya(i + 1), greg: g.getDate() });
  }
  return cells;
}

export default function HebrewDatePicker({ id, labelledBy, value, onChange, isEnabled = () => true, display, maxMonthsAhead = 12 }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => firstOfMonth(new HDate(value ? parse(value) : today())));
  const wrap = useRef(null);
  const grid = useRef(null);

  const minMonth = firstOfMonth(new HDate(today()));
  const atMin = month.abs() <= minMonth.abs();
  let maxMonth = minMonth;
  for (let i = 0; i < maxMonthsAhead; i++) maxMonth = firstOfMonth(maxMonth.add(maxMonth.daysInMonth(), 'd'));
  const atMax = month.abs() >= maxMonth.abs();

  // open on the month of the chosen date
  useEffect(() => { if (open) setMonth(firstOfMonth(new HDate(value ? parse(value) : today()))); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // focus the chosen (or first available) day when opening or changing month
  useEffect(() => {
    if (!open || !grid.current) return;
    const el = grid.current.querySelector('[aria-pressed="true"]') || grid.current.querySelector('button:not(:disabled)');
    el?.focus();
  }, [open, month]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); wrap.current?.querySelector('.hdp-field')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const prev = () => setMonth(firstOfMonth(month.prev()));
  const next = () => setMonth(firstOfMonth(month.add(month.daysInMonth(), 'd')));
  const todayIso = iso(today());
  const first = month.greg();
  const last = new Date(first.getFullYear(), first.getMonth(), first.getDate() + month.daysInMonth() - 1);
  const gregRange = `${first.toLocaleDateString('he-IL', { month: 'long' })}${first.getMonth() !== last.getMonth() ? `–${last.toLocaleDateString('he-IL', { month: 'long' })}` : ''} ${last.getFullYear()}`;

  // arrow keys move between days (RTL: left = next day)
  function onGridKey(e) {
    const step = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const btns = [...grid.current.querySelectorAll('button[data-i]')];
    const i = btns.indexOf(document.activeElement);
    for (let j = i + step; j >= 0 && j < btns.length; j += step) if (!btns[j].disabled) { btns[j].focus(); return; }
  }

  return (
    <div className="hdp" ref={wrap}>
      <button type="button" id={id} className="hdp-field" aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="hdp-value">{value ? display(value) : 'בחירת תאריך'}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
      </button>
      {open && (
        <div className="hdp-pop" role="dialog" aria-label="לוח שנה עברי">
          <div className="hdp-head">
            <button type="button" className="hdp-nav" onClick={prev} disabled={atMin} aria-label="החודש הקודם">›</button>
            <div className="hdp-title">
              <b>{monthTitle(month)}</b>
              <span className="muted small">{gregRange}</span>
            </div>
            <button type="button" className="hdp-nav" onClick={next} disabled={atMax} aria-label="החודש הבא">‹</button>
          </div>
          <div className="hdp-grid" ref={grid} onKeyDown={onGridKey}>
            {DAY_HEADS.map((d) => <span key={d} className="hdp-dow">{d}</span>)}
            {monthCells(month).map((c, i) => c === null
              ? <span key={`b${i}`} />
              : (
                <button
                  key={c.iso} type="button" data-i={i}
                  className={`hdp-day${c.iso === todayIso ? ' today' : ''}`}
                  aria-pressed={c.iso === value}
                  aria-label={display(c.iso)}
                  disabled={!isEnabled(c.iso)}
                  onClick={() => { onChange(c.iso); setOpen(false); wrap.current?.querySelector('.hdp-field')?.focus(); }}
                >
                  <span className="h">{c.heb}</span>
                  <span className="g num">{c.greg}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
