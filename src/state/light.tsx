// La lumière de Jacmel, en direct : position du soleil → variables CSS + thème jour/nuit.
// Le cadran peut simuler une autre heure ; les horaires d’ouverture restent toujours réels.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { sunPosition, moonPhase } from '../lib/sun'
import { soleilDuJour, openState, jacmelTime, type OpenState } from '../lib/jacmel'
import { reducedMotion } from '../lib/motion'

export type Phase = 'nuit' | 'aube' | 'matin' | 'matinée' | 'midi' | 'après-midi' | 'heure dorée' | 'crépuscule'

export type Light = {
  /** heure réelle */
  now: number
  /** heure affichée par la lumière (réelle ou simulée) */
  t: number
  simulated: boolean
  elevation: number
  azimuth: number
  night: boolean
  phase: Phase
  /** « soleil haut, lumière blanche » */
  ambiance: string
  sun: { sunrise: number; noon: number; sunset: number }
  moon: number
  open: OpenState
  setSimulated: (ms: number | null) => void
  /** pendant un glissé du cadran : transitions courtes */
  setScrubbing: (on: boolean) => void
}

const LightContext = createContext<Light | null>(null)

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

function phaseOf(elevation: number, morning: boolean): Phase {
  if (elevation < -6) return 'nuit'
  if (elevation < 0) return morning ? 'aube' : 'crépuscule'
  if (elevation < 12) return morning ? 'matin' : 'heure dorée'
  if (elevation < 58) return morning ? 'matinée' : 'après-midi'
  return 'midi'
}

function ambianceOf(phase: Phase, moon: number) {
  switch (phase) {
    case 'nuit':
      return Math.abs(moon - 0.5) < 0.07 ? 'pleine lune sur la baie' : 'nuit noire, la maison allume ses lampes'
    case 'aube':
      return 'l’aube blanchit la baie'
    case 'matin':
      return 'lumière basse, encore fraîche'
    case 'matinée':
      return 'lumière franche, ombres longues'
    case 'midi':
      return 'soleil haut, lumière blanche'
    case 'après-midi':
      return 'lumière dure, ombres courtes'
    case 'heure dorée':
      return 'heure dorée, les façades prennent le cuivre'
    case 'crépuscule':
      return 'crépuscule, la ville se fond dans l’eau'
  }
}

/** Traduit la position du soleil en variables CSS pour les murs, les ombres et la fenêtre. */
function applyLight(elevation: number, azimuth: number, night: boolean) {
  const root = document.documentElement
  const day = smooth(-4, 9, elevation)
  const high = clamp(elevation / 72)
  const warm = 1 - smooth(4, 40, elevation)
  const morning = azimuth < 180
  const side = morning ? -1 : 1
  const rgb = [255, lerp(247, 212, warm), lerp(236, 160, warm)].map(Math.round)

  const set = (k: string, v: string) => root.style.setProperty(k, v)
  set('--sun-day', day.toFixed(3))
  set('--sun-warm', warm.toFixed(3))
  set('--light-rgb', rgb.join(' '))
  set('--light-alpha', (night ? 0 : 0.42 + 0.58 * day).toFixed(3))
  set('--light-angle', `${(side * (6 + 30 * (1 - high))).toFixed(2)}deg`)
  set('--light-x', `${(morning ? lerp(-8, 10, high) : lerp(32, 22, high)).toFixed(2)}%`)
  set('--light-stretch', (1 + 0.85 * (1 - high)).toFixed(3))
  set('--light-slat', `${lerp(30, 54, high).toFixed(1)}px`)
  if (night) {
    set('--shadow-x', '0px')
    set('--shadow-y', '22px')
    set('--shadow-blur', '34px')
    set('--shadow-alpha', '0.55')
  } else {
    set('--shadow-x', `${(-side * lerp(28, 4, high)).toFixed(1)}px`)
    set('--shadow-y', `${lerp(6, 22, high).toFixed(1)}px`)
    set('--shadow-blur', `${lerp(22, 36, high).toFixed(1)}px`)
    set('--shadow-alpha', (0.12 + 0.16 * day).toFixed(3))
  }
}

export function LightProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now())
  const [simulated, setSimulatedState] = useState<number | null>(null)
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000)
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const t = simulated ?? now
  const { elevation, azimuth } = sunPosition(t)
  const night = elevation < -4
  const morning = azimuth < 180
  const phase = phaseOf(elevation, morning)
  const moon = moonPhase(t)
  const jour = jacmelTime(t)
  const sun = useMemo(() => soleilDuJour(t), [jour.y, jour.m, jour.d])
  const minute = Math.floor(now / 60_000)
  const open = useMemo(() => openState(now), [minute])

  // thème + variables CSS
  const firstApply = useRef(true)
  useEffect(() => {
    const root = document.documentElement
    const theme = night ? 'nuit' : 'jour'
    if (root.dataset.theme !== theme) {
      if (!firstApply.current && !reducedMotion()) {
        root.classList.add('theme-fade')
        setTimeout(() => root.classList.remove('theme-fade'), 1300)
      }
      root.dataset.theme = theme
      root.style.colorScheme = night ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#0E1430' : '#F9F8F5')
    }
    root.dataset.phase = phase
    root.dataset.simulated = simulated === null ? 'false' : 'true'
    applyLight(elevation, azimuth, night)
    firstApply.current = false
  }, [elevation, azimuth, night, phase, simulated])

  const setSimulated = useCallback((ms: number | null) => setSimulatedState(ms), [])
  const setScrubbing = useCallback((on: boolean) => {
    clearTimeout(scrubTimer.current)
    if (on) document.documentElement.classList.add('scrubbing')
    else scrubTimer.current = setTimeout(() => document.documentElement.classList.remove('scrubbing'), 120)
  }, [])

  const value: Light = {
    now,
    t,
    simulated: simulated !== null,
    elevation,
    azimuth,
    night,
    phase,
    ambiance: ambianceOf(phase, moon),
    sun,
    moon,
    open,
    setSimulated,
    setScrubbing,
  }
  return <LightContext.Provider value={value}>{children}</LightContext.Provider>
}

export function useLight() {
  const v = useContext(LightContext)
  if (!v) throw new Error('useLight hors de LightProvider')
  return v
}
