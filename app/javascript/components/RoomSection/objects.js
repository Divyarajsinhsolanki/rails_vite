const roomObjects = [
  {
    id: "painting",
    wall: "back",
    top: "38px",
    left: "34px",
    width: "86px",
    height: "62px",
    label: "Painting",
    description: "Featured knowledge paths — start with curated guides and visual explainers.",
    svg: `<svg viewBox="0 0 120 86" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect x="8" y="8" width="104" height="70" rx="8" fill="#0f172a" stroke="#6366f1" stroke-width="4"/>
      <path d="M18 64 42 40l18 18 16-24 26 30" fill="none" stroke="#67e8f9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="82" cy="28" r="8" fill="#a78bfa"/>
      <rect x="18" y="18" width="84" height="50" rx="5" fill="rgba(99,102,241,0.14)"/>
    </svg>`,
  },
  {
    id: "tv",
    wall: "back",
    top: "48px",
    left: "148px",
    width: "112px",
    height: "70px",
    label: "Smart TV",
    description: "Resource library — browse all guides, tutorials, walkthroughs, and saved learning cards here.",
    svg: `<svg viewBox="0 0 150 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect x="10" y="8" width="130" height="72" rx="10" fill="#050816" stroke="#38bdf8" stroke-width="5"/>
      <rect x="22" y="20" width="106" height="48" rx="6" fill="#111827"/>
      <path d="M30 58h56M30 44h86M30 30h42" stroke="#818cf8" stroke-width="6" stroke-linecap="round"/>
      <path d="M58 82h34M75 80v10" stroke="#67e8f9" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "clock",
    wall: "back",
    top: "34px",
    left: "250px",
    width: "54px",
    height: "54px",
    label: "Clock",
    description: "Study reminders — review due bookmarks and keep your learning rhythm on schedule.",
    svg: `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="45" cy="45" r="36" fill="#101520" stroke="#f8fafc" stroke-width="5"/>
      <circle cx="45" cy="45" r="4" fill="#6366f1"/>
      <path d="M45 23v22l16 10" stroke="#67e8f9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M45 10v8M45 72v8M10 45h8M72 45h8" stroke="#818cf8" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "door",
    wall: "left",
    top: "76px",
    left: "28px",
    width: "72px",
    height: "132px",
    label: "Door",
    description: "Entry point for collections — move between saved topics, due reviews, and category lanes.",
    svg: `<svg viewBox="0 0 90 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <path d="M18 138V14h54v124" fill="#111827" stroke="#6366f1" stroke-width="5" stroke-linejoin="round"/>
      <path d="M30 130V26h30v104" fill="#172033"/>
      <circle cx="54" cy="78" r="5" fill="#67e8f9"/>
      <path d="M16 138h58" stroke="#a78bfa" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "bookshelf",
    wall: "left",
    top: "54px",
    left: "116px",
    width: "88px",
    height: "138px",
    label: "Bookshelf",
    description: "Knowledge collections — organize articles, notes, and repeated study material by topic.",
    svg: `<svg viewBox="0 0 110 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect x="12" y="10" width="86" height="138" rx="8" fill="#0f172a" stroke="#6366f1" stroke-width="5"/>
      <path d="M18 52h74M18 96h74" stroke="#475569" stroke-width="5"/>
      <rect x="24" y="24" width="12" height="28" rx="2" fill="#67e8f9"/>
      <rect x="40" y="20" width="13" height="32" rx="2" fill="#818cf8"/>
      <rect x="58" y="28" width="10" height="24" rx="2" fill="#a78bfa"/>
      <rect x="26" y="64" width="12" height="32" rx="2" fill="#38bdf8"/>
      <rect x="44" y="68" width="14" height="28" rx="2" fill="#6366f1"/>
      <rect x="64" y="60" width="10" height="36" rx="2" fill="#c4b5fd"/>
      <rect x="28" y="110" width="42" height="20" rx="5" fill="#1e293b"/>
      <circle cx="78" cy="120" r="9" fill="#67e8f9"/>
    </svg>`,
  },
  {
    id: "lamp",
    wall: "right",
    top: "68px",
    left: "34px",
    width: "58px",
    height: "114px",
    label: "Lamp",
    description: "Daily highlights — quick facts, quotes, words, and small prompts for focused learning.",
    svg: `<svg viewBox="0 0 90 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <path d="M26 58h38l-8-34H34z" fill="#818cf8" stroke="#c4b5fd" stroke-width="4" stroke-linejoin="round"/>
      <path d="M45 58v62M28 132h34" stroke="#67e8f9" stroke-width="6" stroke-linecap="round"/>
      <path d="M18 58h54" stroke="#6366f1" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="45" cy="74" rx="28" ry="10" fill="rgba(99,102,241,0.22)"/>
    </svg>`,
  },
  {
    id: "plant",
    wall: "right",
    top: "126px",
    left: "120px",
    width: "84px",
    height: "94px",
    label: "Plant",
    description: "Growth tracker — monitor saved knowledge, due reviews, and learning streak momentum.",
    svg: `<svg viewBox="0 0 110 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <path d="M38 110h34l8-42H30z" fill="#1e293b" stroke="#6366f1" stroke-width="5" stroke-linejoin="round"/>
      <path d="M55 70c-18-14-23-32-11-48 16 10 22 26 11 48Z" fill="#22c55e"/>
      <path d="M58 70c5-22 18-34 38-34 0 22-13 34-38 34Z" fill="#67e8f9"/>
      <path d="M52 70C36 62 22 65 12 80c17 9 31 6 40-10Z" fill="#818cf8"/>
      <path d="M55 72v28" stroke="#c4b5fd" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "computer-desk",
    wall: "back",
    top: "144px",
    left: "138px",
    width: "130px",
    height: "78px",
    label: "Computer Desk",
    description: "Developer tools and technical cards — coding tips, open issues, and tech news live here.",
    svg: `<svg viewBox="0 0 170 105" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect x="46" y="10" width="78" height="48" rx="6" fill="#050816" stroke="#38bdf8" stroke-width="5"/>
      <path d="M58 28h34M58 42h54" stroke="#818cf8" stroke-width="5" stroke-linecap="round"/>
      <path d="M84 60v14M66 76h38" stroke="#67e8f9" stroke-width="5" stroke-linecap="round"/>
      <path d="M18 78h134M34 78v20M136 78v20" stroke="#6366f1" stroke-width="7" stroke-linecap="round"/>
      <rect x="108" y="64" width="28" height="12" rx="4" fill="#a78bfa"/>
    </svg>`,
  },
];

export default roomObjects;
