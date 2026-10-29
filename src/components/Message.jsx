export default function Message({ msg }) {
  if (!msg?.text) return null;
  return <div className={`msg ${msg.kind || 'err'}`} role={msg.kind === 'ok' ? 'status' : 'alert'}>{msg.text}</div>;
}
