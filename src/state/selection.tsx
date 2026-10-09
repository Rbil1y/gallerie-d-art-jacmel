// Le point rouge du visiteur : les œuvres qu’il met de côté, gardées entre deux visites.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { lire, ecrire } from '../lib/storage'
import { oeuvre } from '../content/artworks'

type Selection = {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
}

const SelectionContext = createContext<Selection | null>(null)
const CLE = 'gallerie:selection'

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => lire<string[]>(CLE, []).filter(id => !!oeuvre(id)))
  const [annonce, setAnnonce] = useState('')

  useEffect(() => ecrire(CLE, ids), [ids])

  const idsRef = useRef(ids)
  idsRef.current = ids

  const toggle = useCallback((id: string) => {
    const on = !idsRef.current.includes(id)
    const a = oeuvre(id)
    setAnnonce(a ? `« ${a.titre} » ${on ? 'ajoutée à' : 'retirée de'} votre sélection.` : '')
    if (on) navigator.vibrate?.(8)
    setIds(prev => (on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(x => x !== id)))
  }, [])
  const remove = useCallback((id: string) => setIds(prev => prev.filter(x => x !== id)), [])
  const clear = useCallback(() => setIds([]), [])

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle, remove, clear }), [ids, toggle, remove, clear])

  return (
    <SelectionContext.Provider value={value}>
      {children}
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const v = useContext(SelectionContext)
  if (!v) throw new Error('useSelection hors de SelectionProvider')
  return v
}
