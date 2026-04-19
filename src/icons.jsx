/* global React */
// Icons — minimal Lucide-style set as inline SVGs. Outline, 1.5 stroke.
const I = ({ path, size = 16, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icon = {
  dash: (p) => <I {...p} path={<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>} />,
  bid: (p) => <I {...p} path={<><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4"/><path d="M12 11v10"/></>} />,
  project: (p) => <I {...p} path={<><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></>} />,
  budget: (p) => <I {...p} path={<><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18"/><path d="M9 4v16"/></>} />,
  compare: (p) => <I {...p} path={<><path d="M12 3v18"/><path d="M5 8l-2 2 2 2"/><path d="M19 16l2-2-2-2"/><path d="M3 10h9"/><path d="M12 14h9"/></>} />,
  gantt: (p) => <I {...p} path={<><path d="M3 5h8"/><path d="M8 10h10"/><path d="M5 15h11"/><path d="M9 20h7"/></>} />,
  docs: (p) => <I {...p} path={<><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>} />,
  cart: (p) => <I {...p} path={<><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M3 4h2l2.5 11h11l2-8H6"/></>} />,
  money: (p) => <I {...p} path={<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></>} />,
  team: (p) => <I {...p} path={<><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20c.5-2.5 3-3 5-3"/></>} />,
  cog: (p) => <I {...p} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  search: (p) => <I {...p} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />,
  bell: (p) => <I {...p} path={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  plus: (p) => <I {...p} path={<><path d="M12 5v14M5 12h14"/></>} />,
  upload: (p) => <I {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/></>} />,
  down: (p) => <I {...p} path={<><path d="m6 9 6 6 6-6"/></>} />,
  up: (p) => <I {...p} path={<><path d="m6 15 6-6 6 6"/></>} />,
  right: (p) => <I {...p} path={<><path d="m9 18 6-6-6-6"/></>} />,
  left: (p) => <I {...p} path={<><path d="m15 18-6-6 6-6"/></>} />,
  x: (p) => <I {...p} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />,
  check: (p) => <I {...p} path={<><path d="M20 6 9 17l-5-5"/></>} />,
  filter: (p) => <I {...p} path={<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>} />,
  sort: (p) => <I {...p} path={<><path d="M3 6h13M3 12h9M3 18h5"/><path d="m17 11 4 4 4-4"/></>} />,
  sparkle: (p) => <I {...p} path={<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.9 2.6L22 21l-2.1 1L19 24l-.9-2L16 21l2.1-1z"/></>} />,
  ai: (p) => <I {...p} path={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></>} />,
  warn: (p) => <I {...p} path={<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>} />,
  info: (p) => <I {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></>} />,
  trend: (p) => <I {...p} path={<><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></>} />,
  cloud: (p) => <I {...p} path={<><path d="M18 10a5 5 0 0 0-9.6-1.5A4 4 0 0 0 6 16h12a4 4 0 0 0 0-6z"/><path d="M12 14v4M9 17l3 2 3-2"/></>} />,
  folder: (p) => <I {...p} path={<><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>} />,
  file: (p) => <I {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />,
  xlsx: (p) => <I {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13l4 6M12 13l-4 6"/></>} />,
  pdf: (p) => <I {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />,
  dwg: (p) => <I {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 15l2 2 4-4"/></>} />,
  sun: (p) => <I {...p} path={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.4 1.4M17.66 17.66l1.4 1.4M2 12h2M20 12h2M4.93 19.07l1.4-1.4M17.66 6.34l1.4-1.4"/></>} />,
  moon: (p) => <I {...p} path={<><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>} />,
  sidebar: (p) => <I {...p} path={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>} />,
  more: (p) => <I {...p} path={<><circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>} />,
  grip: (p) => <I {...p} path={<><circle cx="9" cy="6" r=".8"/><circle cx="15" cy="6" r=".8"/><circle cx="9" cy="12" r=".8"/><circle cx="15" cy="12" r=".8"/><circle cx="9" cy="18" r=".8"/><circle cx="15" cy="18" r=".8"/></>} />,
  link: (p) => <I {...p} path={<><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>} />,
  download: (p) => <I {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>} />,
  calendar: (p) => <I {...p} path={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>} />,
  clock: (p) => <I {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  arrowR: (p) => <I {...p} path={<><path d="M5 12h14M13 5l7 7-7 7"/></>} />,
  history: (p) => <I {...p} path={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>} />,
  eye: (p) => <I {...p} path={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
};

window.Icon = Icon;
