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

export const fmtLong = (s) =>
  parse(s).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = (s) => parse(s).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
export const fmtMonth = (s) => parse(s).toLocaleDateString('he-IL', { month: 'long' });
export const fmtHeb = (s) => {
  try { return parse(s).toLocaleDateString('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long' }); }
  catch { return ''; }
};

export const whenLabel = (s) => {
  const left = daysUntil(s);
  if (left > 1) return `בעוד ${left} ימים`;
  if (left === 1) return 'מחר';
  if (left === 0) return 'היום';
  return 'ממתינה לעריכה';
};
