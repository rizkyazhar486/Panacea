// Minimal inline icon set (stroke-based, currentColor) — no external dependency.
type P = { size?: number; className?: string }
const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
})

export const IconDashboard = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

export const IconChat = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
  </svg>
)

export const IconEMR = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M12 11v5M9.5 13.5h5" />
  </svg>
)

export const IconPlan = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M9 11l3 3 8-8" />
    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
  </svg>
)

export const IconHeart = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 11h3l2-5 3 9 2.5-6 1.5 2h6" />
  </svg>
)

export const IconSettings = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.18-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

export const IconSparkle = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Z" />
    <path d="M19 14l.7 1.8L21.5 16l-1.8.7L19 18.5l-.7-1.8L16.5 16l1.8-.5L19 14Z" />
  </svg>
)

export const IconCheck = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IconSend = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
)

export const IconPlus = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconShield = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

export const IconStore = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
  </svg>
)

export const IconWallet = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5" />
    <circle cx="16.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
)

export const IconUpload = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M12 16V4M7 9l5-5 5 5" />
  </svg>
)

export const IconToken = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.2 9.2a3 3 0 0 1 0 5.6M15 8.5h-3a2 2 0 0 0 0 4h0a2 2 0 0 1 0 4H9" />
  </svg>
)

export const IconBook = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
    <path d="M4 19a2 2 0 0 1 2-2h12" />
  </svg>
)

export const IconPhone = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
)
export const IconUser = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)
export const IconUsers = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5a3.5 3.5 0 0 1 0 7M22 20a6.5 6.5 0 0 0-5-6.3" />
  </svg>
)
export const IconLogout = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
)
export const IconHospital = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
    <path d="M2 21h20M12 7v6M9 10h6" />
  </svg>
)
export const IconStethoscope = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3" />
    <path d="M8 13v2a5 5 0 0 0 10 0v-2" />
    <circle cx="18" cy="9" r="2" />
  </svg>
)
export const IconFood = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 3v7a2 2 0 0 0 4 0V3M6 10v11M16 3c-2 0-3 2-3 5s1 4 3 4 3-1 3-4-1-5-3-5ZM16 12v9" />
  </svg>
)
export const IconVideo = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M22 8l-6 4 6 4V8Z" />
  </svg>
)
export const IconChartUp = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
)
export const IconScissors = ({ size = 18, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.1 15.9M14.5 12.5 20 20M8.1 8.1 12 12" />
  </svg>
)
export const IconRun = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="14" cy="4" r="2" />
    <path d="M11 7l-3 3 3 2 1 5M12 12l4 1 2 4M9 21l1.5-4M8 10l-3 1-1 3" />
  </svg>
)
export const IconDrop = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
  </svg>
)
export const IconFlame = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c2 1.5 3 3.5 3 5.5a5 5 0 0 1-10 0C7 16 12 13 12 3Z" />
  </svg>
)
export const IconLeaf = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 20C3 11 9 4 20 4c0 11-7 17-16 16Z" />
    <path d="M9 15c2-3 5-5 8-6" />
  </svg>
)
export const IconArticle = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)
export const IconComment = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12Z" />
  </svg>
)
export const IconHome = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    <path d="M9 21v-6h6v6" />
  </svg>
)
export const IconSearch = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)
export const IconBookmark = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
  </svg>
)
export const IconRepost = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 9V7a2 2 0 0 1 2-2h11M20 7l-3-3M20 15v2a2 2 0 0 1-2 2H7M4 17l3 3" />
  </svg>
)
export const IconLock = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="4.5" y="11" width="15" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
export const IconPill = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
    <path d="M8.5 8.5l7 7" />
  </svg>
)
export const IconMoon = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 12.8A8 8 0 1 1 11.2 3 6.2 6.2 0 0 0 21 12.8Z" />
  </svg>
)
export const IconSun = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </svg>
)
export const IconArchitecture = ({ size = 20, className = '' }: P) => (
  <svg {...base(size, className)}>
    <rect x="9" y="3" width="6" height="5" rx="1" />
    <rect x="3" y="16" width="6" height="5" rx="1" />
    <rect x="15" y="16" width="6" height="5" rx="1" />
    <path d="M12 8v4M12 12H6v4M12 12h6v4" />
  </svg>
)
