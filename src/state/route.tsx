// Les surcouches (œuvre, carnet, plan, sélection) vivent dans l’URL :
// un lien se partage, et le bouton Retour du navigateur referme.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Route =
  | { kind: 'none' }
  | { kind: 'oeuvre'; id: string }
  | { kind: 'carnet'; no: string }
  | { kind: 'plan' }
  | { kind: 'selection' }

const NONE: Route = { kind: 'none' }

export function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  let m = /^oeuvre-(\d{3})$/.exec(h)
  if (m) return { kind: 'oeuvre', id: m[1] }
  m = /^carnet-(\d+)$/.exec(h)
  if (m) return { kind: 'carnet', no: m[1] }
  if (h === 'plan') return { kind: 'plan' }
  if (h === 'selection') return { kind: 'selection' }
  return NONE
}

export function hashOf(r: Route) {
  switch (r.kind) {
    case 'oeuvre':
      return `#oeuvre-${r.id}`
    case 'carnet':
      return `#carnet-${r.no}`
    case 'plan':
      return '#plan'
    case 'selection':
      return '#selection'
    default:
      return ''
  }
}

type RouteApi = {
  route: Route
  open: (r: Route) => void
  /** remplace la surcouche courante sans empiler l’historique (œuvre suivante…) */
  swap: (r: Route) => void
  close: () => void
}

const RouteContext = createContext<RouteApi | null>(null)

const cleanUrl = () => location.pathname + location.search

export function RouteProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))

  useEffect(() => {
    const onPop = () => setRoute(parse(location.hash))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = useCallback((r: Route) => {
    const overlayOpen = parse(location.hash).kind !== 'none'
    if (overlayOpen) history.replaceState({ overlay: true }, '', hashOf(r))
    else history.pushState({ overlay: true }, '', hashOf(r))
    setRoute(r)
  }, [])

  const swap = useCallback((r: Route) => {
    history.replaceState({ overlay: true }, '', hashOf(r))
    setRoute(r)
  }, [])

  const close = useCallback(() => {
    if ((history.state as { overlay?: boolean } | null)?.overlay) history.back()
    else {
      history.replaceState(null, '', cleanUrl())
      setRoute(NONE)
    }
  }, [])

  const value = useMemo(() => ({ route, open, swap, close }), [route, open, swap, close])
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
}

export function useRoute() {
  const v = useContext(RouteContext)
  if (!v) throw new Error('useRoute hors de RouteProvider')
  return v
}
