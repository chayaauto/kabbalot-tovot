// The site's mark: two Shabbat candles with their flames, drawn in currentColor + gold.
export default function Emblem({ size = 40, className = 'emblem' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="0" y="0" width="48" height="48" rx="13" fill="var(--brand)" />
      <g fill="var(--gold-bright)">
        <path d="M18 9c2.4 2.6 3.3 4.6 3.3 6.3a3.3 3.3 0 0 1-6.6 0c0-1.7 1-3.7 3.3-6.3z" />
        <path d="M30 9c2.4 2.6 3.3 4.6 3.3 6.3a3.3 3.3 0 0 1-6.6 0c0-1.7 1-3.7 3.3-6.3z" />
      </g>
      <g fill="#fffaf0">
        <rect x="15.6" y="21" width="4.8" height="16" rx="1.2" />
        <rect x="27.6" y="21" width="4.8" height="16" rx="1.2" />
      </g>
      <rect x="11" y="37" width="26" height="3.2" rx="1.6" fill="var(--gold-bright)" />
    </svg>
  );
}
