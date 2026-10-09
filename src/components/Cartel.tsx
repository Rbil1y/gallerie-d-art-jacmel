// Le cartel : l’étiquette de musée, au pied de l’œuvre.
import type { Artwork } from '../content/artworks'
import { dimensions, prix, numero } from '../lib/fr'
import { Dot } from './RedDot'

type Props = { a: Artwork; className?: string; withNumber?: boolean; headingLevel?: 'h3' | 'p' }

export function Cartel({ a, className = '', withNumber = true, headingLevel = 'p' }: Props) {
  const Title = headingLevel
  return (
    <div className={`cartel ${className}`}>
      {withNumber && <p className="cartel__no label">{numero(a.id)}</p>}
      <p className="cartel__artist">{a.artiste}</p>
      <Title className="cartel__title">
        <i>{a.titre}</i>, {a.annee}
      </Title>
      <p className="cartel__meta">
        {a.medium}
        <br />
        {dimensions(a.hCm, a.lCm)}
      </p>
      <p className={`cartel__status ${a.statut === 'réservée' ? 'is-reserved' : ''}`}>
        {a.statut === 'réservée' ? (
          <>
            <Dot /> Réservée
          </>
        ) : (
          prix(a.prix)
        )}
      </p>
    </div>
  )
}
