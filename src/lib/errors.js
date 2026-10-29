// Turns Supabase errors into clear Hebrew messages.
export function heError(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return 'האימייל או הסיסמה שגויים.';
  if (/Email not confirmed/i.test(m)) return 'צריך לאשר את הכתובת דרך הקישור שנשלח למייל שלך, ואז להיכנס.';
  if (/already registered/i.test(m)) return 'הכתובת הזאת כבר רשומה. אפשר להיכנס, או לאפס סיסמה אם שכחת.';
  if (/Password should be/i.test(m)) return 'הסיסמה צריכה להיות באורך 6 תווים לפחות.';
  if (/same.*password|different from the old/i.test(m)) return 'הסיסמה החדשה צריכה להיות שונה מהקודמת.';
  if (/rate limit|too many/i.test(m)) return 'היו יותר מדי ניסיונות. כדאי לחכות כמה דקות ולנסות שוב.';
  if (/Unable to validate email|invalid.*email/i.test(m)) return 'כתובת האימייל לא תקינה.';
  if (/row-level security|violates/i.test(m)) return 'אין הרשאה לפעולה הזאת. אפשר לסמן רק את השבוע הנוכחי.';
  if (/one_upcoming_draw/i.test(m)) return 'כבר קיימת הגרלה קרובה. יש לערוך אותה במקום ליצור חדשה.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'אין חיבור לשרת. כדאי לבדוק את החיבור לאינטרנט ולנסות שוב.';
  return m;
}
