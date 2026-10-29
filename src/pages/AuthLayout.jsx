import DrawCard, { useNextDraw } from '../components/DrawCard.jsx';

// Shared frame for login / sign-up / password pages: the form on one side,
// the next draw and a short "how it works" on the other.
export default function AuthLayout({ children }) {
  const [draw] = useNextDraw();
  return (
    <div className="auth-wrap">
      <div className="auth-card">{children}</div>
      <aside className="auth-side">
        <DrawCard draw={draw} compact />
        <h2>איך זה עובד</h2>
        <ol className="steps">
          <li><b>1</b><span>מקבלות על עצמנו קבלה טובה לזכות הישועה.</span></li>
          <li><b>2</b><span>במוצאי שבת מסמנות באתר שקיימנו את הקבלה בשבת. כל שבת מסומנת היא כרטיס בהגרלה.</span></li>
          <li><b>3</b><span>מי שצברה יותר שבתות, סיכוייה גבוהים יותר.</span></li>
        </ol>
      </aside>
    </div>
  );
}
