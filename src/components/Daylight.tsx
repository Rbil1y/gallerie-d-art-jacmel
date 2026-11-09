// La fenêtre : le soleil de Jacmel passe les persiennes et pose des lames de lumière sur le mur.
// Géométrie pilotée par les variables CSS de LightProvider.
import type { CSSProperties } from 'react'

type Props = { className?: string; style?: CSSProperties }

export function Daylight({ className = '', style }: Props) {
  return (
    <div className={`daylight ${className}`} style={style} aria-hidden>
      <div className="daylight__patch" />
    </div>
  )
}
