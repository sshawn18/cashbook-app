const P = {
  search:   <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  chevron:  <path d="m6 9 6 6 6-6" />,
  plus:     <path d="M12 5v14M5 12h14" />,
  minus:    <path d="M5 12h14" />,
  back:     <path d="m15 6-6 6 6 6" />,
  chart:    <path d="M5 20V10m7 10V4m7 16v-7" />,
  menu:     <path d="M4 7h16M4 12h16M4 17h16" />,
  filter:   <path d="M4 6h16M7 12h10M10 18h4" />,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  close:    <path d="M6 6l12 12M18 6 6 18" />,
  check:    <path d="m5 12 5 5 9-10" />,
  home:     <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z" />,
  tag:      <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.2" /></>,
  arrowUp:  <path d="M12 19V5m0 0-5 5m5-5 5 5" />,
  arrowDown:<path d="M12 5v14m0 0 5-5m-5 5-5-5" />,
  trash:    <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  book:     <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>,
}

export default function Icon({ name, size = 16, className = '', style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  )
}
