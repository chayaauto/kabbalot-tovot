# קבלות טובות לישועה

אתר הגרלה שבועית: כל משתתפת מסמנת בכל שבוע שהשתתפה באתגר, וכל שבוע מסומן הוא כרטיס בהגרלה שנערכת ביום שני.

## עמודי האתר
| כתובת | עמוד | מי רואה |
|---|---|---|
| `/login` | כניסה | כולן |
| `/signup` | הרשמה | כולן |
| `/forgot-password` | שכחתי סיסמה | כולן |
| `/reset-password` | בחירת סיסמה חדשה (מהקישור במייל) | כולן |
| `/` | הבית שלי: סימון שבועי, הכרטיסים שלי, ההגרלה הבאה | מחוברות |
| `/draws` | ההגרלה הבאה והזוכות הקודמות | מחוברות |
| `/admin` | ניהול: קביעת הגרלה ופרס, רשימת משתתפות, עריכת ההגרלה | רק המיילים שברשימת המנהלות |

## טכנולוגיה
- React + Vite + React Router
- Supabase: התחברות, מסד נתונים והרשאות (`supabase-setup.sql`)
- Netlify: כל פוש ל-`main` בונה ומפרסם אוטומטית (`.github/workflows/deploy-netlify.yml`)

## הרצה מקומית
```bash
npm install
npm run dev
```

## מנהלות
מי שנכנסת עם מייל שנמצא בטבלה `admin_emails` ב-Supabase רואה את עמוד הניהול. להוספת מנהלת, ב-SQL Editor:
```sql
insert into public.admin_emails (email) values ('name@gmail.com');
```

## הגדרות ב-Supabase (Authentication → URL Configuration)
- **Site URL:** כתובת האתר, למשל `https://kabbalot-tovot.netlify.app`
- **Redirect URLs:** להוסיף `https://kabbalot-tovot.netlify.app/**` כדי שקישורי האישור ושחזור הסיסמה יחזרו לאתר.
