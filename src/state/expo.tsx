// L’exposition se lit de deux façons : l’accrochage (la promenade) ou la liste des prix (le registre).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Technique } from '../content/artworks'
import { useScrollApi } from './scroll'

export type Mode = 'accrochage' | 'registre'
export type Tri = { cle: 'id' | 'prix' | 'annee'; sens: 1 | -1 }
export type Filtres = { technique: Technique | 'tout'; disponibles: boolean; artiste: string | null }

type ExpoApi = {
  mode: Mode
  setMode: (m: Mode) => void
  filtres: Filtres
  setFiltres: (f: Partial<Filtres>) => void
  tri: Tri
  setTri: (t: Tri) => void
  /** ouvre la liste des prix (éventuellement filtrée sur un artiste) et y descend */
  allerAuRegistre: (opts?: { artiste?: string | null }) => void
  allerAlAccrochage: (salle?: number) => void
}

const ExpoContext = createContext<ExpoApi | null>(null)

const FILTRES_VIDES: Filtres = { technique: 'tout', disponibles: false, artiste: null }

export function ExpoProvider({ children }: { children: ReactNode }) {
  const { scrollTo } = useScrollApi()
  const [mode, setMode] = useState<Mode>('accrochage')
  const [filtres, setF] = useState<Filtres>(FILTRES_VIDES)
  const [tri, setTri] = useState<Tri>({ cle: 'id', sens: 1 })

  const setFiltres = useCallback((f: Partial<Filtres>) => setF(prev => ({ ...prev, ...f })), [])

  const allerAuRegistre = useCallback(
    (opts: { artiste?: string | null } = {}) => {
      setMode('registre')
      setF({ ...FILTRES_VIDES, artiste: opts.artiste ?? null })
      requestAnimationFrame(() => scrollTo('#exposition'))
    },
    [scrollTo],
  )

  const allerAlAccrochage = useCallback(
    (salle?: number) => {
      setMode('accrochage')
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(salle ? `#salle-${salle}` : '#exposition')))
    },
    [scrollTo],
  )

  const value = useMemo(
    () => ({ mode, setMode, filtres, setFiltres, tri, setTri, allerAuRegistre, allerAlAccrochage }),
    [mode, filtres, setFiltres, tri, allerAuRegistre, allerAlAccrochage],
  )
  return <ExpoContext.Provider value={value}>{children}</ExpoContext.Provider>
}

export function useExpo() {
  const v = useContext(ExpoContext)
  if (!v) throw new Error('useExpo hors de ExpoProvider')
  return v
}
