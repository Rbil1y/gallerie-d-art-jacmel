// Pictogrammes au trait fin, alignés sur la graisse du texte d’interface.
type P = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const Arrow = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
  </svg>
)
export const ArrowDown = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" />
  </svg>
)
export const ArrowUp = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" />
  </svg>
)
export const ArrowLeft = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" />
  </svg>
)
export const ArrowUpRight = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </svg>
)
export const Close = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)
export const Copy = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M15.5 5.5v-1A1.5 1.5 0 0 0 14 3H5a1.5 1.5 0 0 0-1.5 1.5V14A1.5 1.5 0 0 0 5 15.5h1" />
  </svg>
)
export const Check = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)
export const Link = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </svg>
)
export const Speaker = ({ size = 18, className, on }: P & { on?: boolean }) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    {on ? <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /> : <path d="m16 9.5 5 5M21 9.5l-5 5" />}
  </svg>
)

/** La lampe de tableau en laiton, au-dessus des œuvres. */
export const PictureLamp = ({ className }: { className?: string }) => (
  <svg width="54" height="14" viewBox="0 0 54 14" className={className} aria-hidden>
    <rect x="25" y="0" width="4" height="6" rx="1" fill="currentColor" opacity=".7" />
    <path d="M4 7.5h46a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" fill="currentColor" />
  </svg>
)

/** Un cadre au mur : l’exposition. */
export const Frame = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5 8.5 7M12 3.5 15.5 7" />
    <rect x="4" y="7" width="16" height="12.5" rx="0.5" />
    <rect x="7.5" y="10.5" width="9" height="5.5" />
  </svg>
)
