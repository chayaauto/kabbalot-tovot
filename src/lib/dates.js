import { HDate, Sedra, Locale, gematriya } from '@hebcal/core';

// All dates are local (Israel) calendar dates as 'YYYY-MM-DD' strings.
// A week runs Sunday–Saturday and is identified by its Sunday.

const pad = (n) => String(n).padStart(2, '0');

export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
export const weekStart = (d) => addDays(d, -d.getDay());
export const thisWeek = () => iso(weekStart(today()));
export const lastWeek = () => iso(addDays(weekStart(today()), -7));
export const isSunday = () => today().getDay() === 0;
export const weekEnd = (week) => iso(addDays(parse(week), 6));

// A week counts for a draw if it began no later than draw_date - 8,
// i.e. it ended before the week of the draw. Matches run_draw() in the database.
export const cutoff = (drawDate) => iso(addDays(parse(drawDate), -8));

export const nextMonday = () => {
  const t = today();
  const add = (8 - t.getDay()) % 7 || 7;
  return iso(addDays(t, add));
};

export const daysUntil = (s) => Math.round((parse(s) - today()) / 86400000);

/* ---------- Hebrew calendar (Hebcal, Israel reading schedule) ---------- */

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const he = (s) => Locale.gettext(s, 'he-x-NoNikud');
const hd = (s) => new HDate(parse(s));

// "כ״א חשון"
export const hebDayMonth = (s) => { const h = hd(s); return `${gematriya(h.getDate())} ${he(h.getMonthName())}`; };
// "כ״א חשון תשפ״ז"
export const hebDate = (s) => hd(s).renderGematriya(true);
// "יום שני, כ״א חשון תשפ״ז"
export const hebLong = (s) => `יום ${WEEKDAYS[parse(s).getDay()]}, ${hebDate(s)}`;
// calendar tile parts
export const hebDay = (s) => gematriya(hd(s).getDate());
export const hebMonth = (s) => he(hd(s).getMonthName());

// The weekly portion read on the Shabbat that ends the week starting `week` (a Sunday).
// Holiday Shabbatot return the holiday's name instead.
export const parshaOf = (week) => {
  const sat = new HDate(parse(week)).onOrAfter(6);
  const r = new Sedra(sat.getFullYear(), true).lookup(sat);
  const name = r.parsha.map(he).join('-');
  return r.chag ? name : `פרשת ${name}`;
};
// Short label for a week chip: "וירא" / "סוכות"
export const parshaShort = (week) => parshaOf(week).replace(/^פרשת /, '');

export const whenLabel = (s) => {
  const left = daysUntil(s);
  if (left > 1) return `בעוד ${left} ימים`;
  if (left === 1) return 'מחר';
  if (left === 0) return 'היום';
  return 'ממתינה לעריכה';
};
