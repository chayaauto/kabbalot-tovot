import { useEffect } from 'react';

// A short message that floats at the bottom of the screen and disappears on its own.
// msg: { text, kind: 'ok' | 'err' }; onDone clears it.
export default function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg?.text) return;
    const t = setTimeout(onDone, msg.kind === 'ok' ? 2600 : 5000);
    return () => clearTimeout(t);
  }, [msg, onDone]);

  return (
    <div className="toast-region" role={msg?.kind === 'ok' ? 'status' : 'alert'} aria-live="polite">
      {msg?.text && (
        <div key={msg.text + (msg.at || '')} className={`toast ${msg.kind || 'err'}`}>
          <span className="toast-dot" aria-hidden="true" />
          <span>{msg.text}</span>
          <button type="button" className="toast-x" onClick={onDone} aria-label="סגירת ההודעה">×</button>
        </div>
      )}
    </div>
  );
}
