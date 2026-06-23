// Sonance Player — shared icon set (Lucide-style strokes, currentColor)
const Icon = ({ d, size = 22, fill = false, stroke = 2.2, children }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {children || (d ? <path d={d} /> : null)}
  </svg>
);

const I = {
  Home:    (p) => <Icon {...p} fill><path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3z"/></Icon>,
  HomeO:   (p) => <Icon {...p}><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></Icon>,
  Search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Library: (p) => <Icon {...p}><path d="M4 5h2v15H4zM9 5h2v15H9z"/><path d="M14 6l3 14 3-1-3-14z"/></Icon>,
  Plus:    (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Heart:   (p) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>,
  HeartF:  (p) => <Icon {...p} fill><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>,
  Play:    (p) => <Icon {...p} fill><path d="M8 5v14l11-7z"/></Icon>,
  Pause:   (p) => <Icon {...p} fill><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></Icon>,
  Prev:    (p) => <Icon {...p} fill><path d="M6 6h2v12H6zM20 6v12L9 12z"/></Icon>,
  Next:    (p) => <Icon {...p} fill><path d="M16 6h2v12h-2zM4 6v12l11-6z"/></Icon>,
  Shuffle: (p) => <Icon {...p}><path d="M16 3h5v5M21 3l-7 7M4 20l7-7M16 21h5v-5M14 14l7 7M3 4l5 5"/></Icon>,
  Repeat:  (p) => <Icon {...p}><path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></Icon>,
  Volume:  (p) => <Icon {...p}><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 5a9 9 0 0 1 0 14M15 9a5 5 0 0 1 0 6"/></Icon>,
  Queue:   (p) => <Icon {...p}><path d="M3 12h13M3 6h18M3 18h10M17 14v8l5-4z"/></Icon>,
  Mic:     (p) => <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  Devices: (p) => <Icon {...p}><rect x="2" y="6" width="14" height="11" rx="2"/><path d="M16 10h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4M6 21h6"/></Icon>,
  Maximize:(p) => <Icon {...p}><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></Icon>,
  More:    (p) => <Icon {...p}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></Icon>,
  Bell:    (p) => <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 0 1-4 0"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevronL:(p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  Download:(p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>,
  Sort:    (p) => <Icon {...p}><path d="M3 6h18M6 12h12M10 18h4"/></Icon>,
  Grid:    (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Icon>,
  List:    (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
  Clock:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  X:       (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  Speaker: (p) => <Icon {...p}><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7" r="0.8" fill="currentColor"/></Icon>,
  Headphones:(p) => <Icon {...p}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></Icon>,
  Pin:     (p) => <Icon {...p}><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z"/></Icon>,
  Lyrics:  (p) => <Icon {...p}><path d="M4 5h16v10H8l-4 4z"/><path d="M8 9h8M8 12h5"/></Icon>,
  Share:   (p) => <Icon {...p}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></Icon>,
  Mini:    (p) => <Icon {...p}><rect x="3" y="9" width="18" height="6" rx="1.5"/></Icon>,
  Friends: (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 7-2"/></Icon>,
  Verified:(p) => <Icon {...p} fill><path d="M12 2l2 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1z"/></Icon>,
  Settings:(p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4.9a7 7 0 0 0-1.7-1L14 3h-4l-.8 2.5a7 7 0 0 0-1.7 1l-2.4-.9-2 3.5L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.5 2.4-.9a7 7 0 0 0 1.7 1L10 21h4l.8-2.5a7 7 0 0 0 1.7-1l2.4.9 2-3.5-2-1.5a7 7 0 0 0 .1-1z"/></Icon>,
  Filter:  (p) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4"/></Icon>,
  Globe:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
};

window.I = I;
