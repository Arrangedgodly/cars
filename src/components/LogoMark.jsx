const LogoMark = ({ className = "h-8 w-8" }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <rect
      x="1"
      y="1"
      width="38"
      height="38"
      rx="9"
      className="fill-base-200"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="13"
      y1="9"
      x2="13"
      y2="31"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="13" y="9" width="4" height="5" fill="currentColor" />
    <rect x="17" y="9" width="4" height="5" className="fill-primary" />
    <rect x="21" y="9" width="4" height="5" fill="currentColor" />
    <rect x="25" y="9" width="4" height="5" className="fill-primary" />
    <rect x="13" y="14" width="4" height="5" className="fill-primary" />
    <rect x="17" y="14" width="4" height="5" fill="currentColor" />
    <rect x="21" y="14" width="4" height="5" className="fill-primary" />
    <rect x="25" y="14" width="4" height="5" fill="currentColor" />
  </svg>
);

export default LogoMark;
