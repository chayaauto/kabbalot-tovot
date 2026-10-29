# קבלות טובות

אתר הגרלה שבועית: כל משתתפת מסמנת בכל שבוע שהשתתפה באתגר, וכל שבוע מסומן הוא כרטיס בהגרלה (המנהלת קובעת את יום ההגרלה).

## עמודי האתר
| כתובת | עמוד | מי רואה |
|---|---|---|
| `/login` | כניסה עם Google (בפעם הראשונה החשבון נפתח אוטומטית) | כולן |
| `/` | דף הבית: מונה המשתתפות וסימון השבת (ראשי), ההגרלה הבאה מתחתיו, ובצד השבתות והכרטיסים שלי | מחוברות |
| `/admin` | ניהול: קביעת הגרלה ופרס, רשימת משתתפות, עריכת ההגרלה | רק המיילים שברשימת המנהלות |

## טכנולוגיה
- React + Vite + React Router
- Supabase: התחברות, מסד נתונים והרשאות (`supabase-setup.sql`)
- Cloudflare Pages: מחובר לריפו, וכל פוש ל-`main` בונה ומפרסם אוטומטית (פקודת בנייה `npm run build`, תיקיית פלט `dist`)
- Netlify במקביל: כל פוש ל-`main` מפרסם גם ל-Netlify (`.github/workflows/deploy-netlify.yml`). בתוכנית החינמית יש מכסת העלאות חודשית; כשהיא נגמרת ההעלאה ל-Netlify נכשלת עד חידוש המכסה, ו-Cloudflare ממשיך לעבוד.

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
- **Site URL:** כתובת האתר, למשל `https://kabbalot-tovot.pages.dev`
- **Redirect URLs:** להוסיף `https://kabbalot-tovot.pages.dev/**` וגם `https://kabbalot-tovot.netlify.app/**`, כדי שהכניסה עם Google תחזור לאתר בשתי הכתובות.
- **Providers → Google:** מופעל, עם Client ID ו-Client Secret מ-Google Cloud.
