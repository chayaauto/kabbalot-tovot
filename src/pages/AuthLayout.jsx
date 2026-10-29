import DrawCard, { useNextDraw } from '../components/DrawCard.jsx';
import Emblem from '../components/Emblem.jsx';

const STEPS = [
  {
    title: 'מקבלות קבלה טובה',
    text: 'כל אחת מקבלת על עצמה קבלה טובה.',
    icon: <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />,
  },
  {
    title: 'מסמנות במוצאי שבת',
    text: 'אחרי השבת מסמנות באתר שקיימנו את הקבלה. כל שבת מסומנת היא כרטיס בהגרלה.',
    icon: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  },
  {
    title: 'משתתפות בהגרלה',
    text: 'הכרטיסים נצברים, ומי שצברה יותר שבתות סיכוייה גבוהים יותר.',
    icon: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" /></>,
  },
];

// Shared frame for the login page: a welcome band, the form beside the next draw, and "how it works".
export default function AuthLayout({ children }) {
  const [draw] = useNextDraw();
  return (
    <main className="page auth">
      <section className="welcome auth-welcome">
        <Emblem size={44} className="emblem welcome-emblem" />
        <h1>קבלות טובות</h1>
        <p className="lead">מתחזקות יחד, שבת אחר שבת, ומתפללות לבשורות טובות לכל אחת ואחת.</p>
      </section>
      <div className="auth-grid">
        <div className="card auth-card">{children}</div>
        <DrawCard draw={draw} compact />
      </div>
      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title" className="section-title">איך זה עובד</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
              </span>
              <span className="step-n" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
