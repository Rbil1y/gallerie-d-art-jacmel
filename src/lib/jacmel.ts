// L’heure de Jacmel, les horaires de la maison et ce qu’ils disent du moment présent.
import { sunTimes } from './sun'

export const TZ = 'America/Port-au-Prince'

export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

/** Horaires par jour de la semaine (0 = dimanche) : [ouverture, fermeture] en heures. */
export const HORAIRES: Record<number, [number, number] | null> = {
  0: [10, 16],
  1: null,
  2: [10, 18],
  3: [10, 18],
  4: [10, 18],
  5: [10, 18],
  6: [10, 19],
}

/** Lignes du tableau des horaires, dans l’ordre d’affichage. */
export const LIGNES_HORAIRES = [
  { jours: [2, 3, 4, 5], label: 'Mardi — vendredi', heures: '10 h — 18 h' },
  { jours: [6], label: 'Samedi', heures: '10 h — 19 h' },
  { jours: [0], label: 'Dimanche', heures: '10 h — 16 h' },
  { jours: [1], label: 'Lundi', heures: 'Fermé' },
]

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
})

export type JacmelTime = { y: number; m: number; d: number; wd: number; h: number; min: number }

export function jacmelTime(ms: number): JacmelTime {
  const p: Record<string, string> = {}
  for (const { type, value } of parts.formatToParts(ms)) p[type] = value
  return { y: +p.year, m: +p.month, d: +p.day, wd: WD[p.weekday], h: +p.hour % 24, min: +p.minute }
}

/** « 14 h 32 » */
export function heure(ms: number) {
  const { h, min } = jacmelTime(ms)
  return `${h} h ${String(min).padStart(2, '0')}`
}

/** « 14 h » ou « 14 h 30 » pour une heure ronde ou non. */
export function heureCourte(h: number) {
  const whole = Math.floor(h)
  const min = Math.round((h - whole) * 60)
  return min ? `${whole} h ${String(min).padStart(2, '0')}` : `${whole} h`
}

/** Lever et coucher du soleil, pour le jour de Jacmel qui contient `ms`. */
export function soleilDuJour(ms: number) {
  const { y, m, d } = jacmelTime(ms)
  return sunTimes(Date.UTC(y, m - 1, d))
}

export type OpenState = {
  open: boolean
  /** « Ouvert · jusqu’à 18 h » / « Fermé · rouvre mardi, 10 h » */
  label: string
  /** heure de fermeture si ouvert */
  closes?: number
  /** prochaine ouverture : « demain », « mardi », « aujourd’hui » */
  next?: { quand: string; h: number }
}

function nextOpening(t: JacmelTime): { quand: string; h: number } {
  const today = HORAIRES[t.wd]
  if (today && t.h + t.min / 60 < today[0]) return { quand: 'aujourd’hui', h: today[0] }
  for (let i = 1; i <= 7; i++) {
    const wd = (t.wd + i) % 7
    const slot = HORAIRES[wd]
    if (slot) return { quand: i === 1 ? 'demain' : JOURS[wd], h: slot[0] }
  }
  return { quand: 'bientôt', h: 10 }
}

export function openState(ms: number): OpenState {
  const t = jacmelTime(ms)
  const slot = HORAIRES[t.wd]
  const now = t.h + t.min / 60
  if (slot && now >= slot[0] && now < slot[1]) {
    return { open: true, closes: slot[1], label: `Ouvert · jusqu’à ${heureCourte(slot[1])}` }
  }
  const next = nextOpening(t)
  const label =
    next.quand === 'aujourd’hui'
      ? `Fermé · ouvre à ${heureCourte(next.h)}`
      : `Fermé · rouvre ${next.quand}, ${heureCourte(next.h)}`
  return { open: false, next, label }
}

/** Index de la ligne du tableau des horaires qui correspond à aujourd’hui. */
export function ligneDuJour(ms: number) {
  const wd = jacmelTime(ms).wd
  return LIGNES_HORAIRES.findIndex(l => l.jours.includes(wd))
}

/** État de l’exposition par rapport à ses dates (jour de Jacmel, AAAA-MM-JJ). */
export function etatExposition(ms: number, debut: string, fin: string): 'à venir' | 'en cours' | 'terminée' {
  const { y, m, d } = jacmelTime(ms)
  const today = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  if (today < debut) return 'à venir'
  if (today > fin) return 'terminée'
  return 'en cours'
}
