// Défilement doux à la molette (Lenis), natif au toucher, et repérage de la pièce courante.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { reducedMotion } from '../lib/motion'

export type Room =
  | 'seuil'
  | 'maison'
  | 'salle-1'
  | 'salle-2'
  | 'salle-3'
  | 'salle-4'
  | 'registre'
  | 'ateliers'
  | 'carnets'
  | 'comptoir'
  | 'rue'

type ScrollApi = {
  scrollTo: (target: string | number, opts?: { immediate?: boolean; offset?: number }) => void
  lock: (on: boolean) => void
  room: Room
}

const ScrollContext = createContext<ScrollApi | null>(null)

export const HEADER_OFFSET = 72

export function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const [room, setRoom] = useState<Room>('seuil')

  useEffect(() => {
    if (reducedMotion()) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 })
    lenisRef.current = lenis
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // pièce courante : la section qui traverse la ligne des 40 % de l’écran
  useEffect(() => {
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) seen.set(e.target, e.isIntersecting)
        const active = [...seen].filter(([, on]) => on).map(([el]) => el as HTMLElement)
        // la plus profonde l’emporte (une salle dans l’exposition)
        const best = active.sort((a, b) => depth(b) - depth(a))[0]
        if (best?.dataset.room) setRoom(best.dataset.room as Room)
      },
      { rootMargin: '-40% 0px -58% 0px' },
    )
    const observeAll = () => {
      document.querySelectorAll('[data-room]').forEach(el => {
        if (!seen.has(el)) {
          seen.set(el, false)
          io.observe(el)
        }
      })
      for (const el of [...seen.keys()]) if (!el.isConnected) {
        io.unobserve(el)
        seen.delete(el)
      }
    }
    observeAll()
    const mo = new MutationObserver(() => observeAll())
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  const scrollTo = useCallback((target: string | number, opts: { immediate?: boolean; offset?: number } = {}) => {
    const offset = opts.offset ?? -HEADER_OFFSET
    const lenis = lenisRef.current
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null
    if (lenis) {
      lenis.scrollTo(el ?? (target as number), { offset: el ? offset : 0, immediate: opts.immediate, duration: 1.3, force: true })
      return
    }
    const top = el ? el.getBoundingClientRect().top + window.scrollY + offset : (target as number)
    window.scrollTo({ top, behavior: opts.immediate || reducedMotion() ? 'auto' : 'smooth' })
  }, [])

  // verrou compté : une surcouche qui sort pendant qu'une autre entre ne libère pas le défilement
  const locks = useRef(0)
  const lock = useCallback((on: boolean) => {
    locks.current = Math.max(0, locks.current + (on ? 1 : -1))
    const lenis = lenisRef.current
    if (locks.current > 0) {
      lenis?.stop()
      document.documentElement.classList.add('is-locked')
    } else {
      lenis?.start()
      document.documentElement.classList.remove('is-locked')
    }
  }, [])

  const value = useMemo(() => ({ scrollTo, lock, room }), [scrollTo, lock, room])
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
}

function depth(el: Element) {
  let d = 0
  for (let p = el.parentElement; p; p = p.parentElement) d++
  return d
}

export function useScrollApi() {
  const v = useContext(ScrollContext)
  if (!v) throw new Error('useScrollApi hors de ScrollProvider')
  return v
}
