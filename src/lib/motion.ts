// Jetons de mouvement partagés entre CSS (tokens.css) et motion/react.

/** Charnière des persiennes : départ lent, arrivée posée. */
export const HINGE = [0.7, 0, 0.2, 1] as const
/** Interface : réponse immédiate, sans rebond. */
export const SETTLE = [0.2, 0.8, 0.2, 1] as const

/** Ressort critique (aucun dépassement) — déplacements, fondus d’interface. */
export const SPRING = { type: 'spring', bounce: 0, duration: 0.4 } as const
/** Feuilles et tiroirs. */
export const SHEET = { type: 'spring', bounce: 0, duration: 0.45 } as const
/** Après un geste avec élan (balayage) : léger rebond. */
export const FLICK = { type: 'spring', bounce: 0.2, duration: 0.4 } as const

/** Mouvement réduit (préférence système), sauf si la démonstration force le mouvement (?motion=full). */
export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  document.documentElement.dataset.motion !== 'full' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
