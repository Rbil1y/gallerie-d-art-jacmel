// Une œuvre accrochée : lampe de laiton, ombre portée selon le soleil, cartel au pied.
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import type { Artwork } from '../content/artworks'
import { image } from '../content/images'
import { useOpenArtwork, layoutIdFor } from '../state/viewerOrigin'
import { Picture } from './Picture'
import { Cartel } from './Cartel'
import { DotToggle } from './RedDot'
import { PictureLamp } from './Icons'

type Props = {
  a: Artwork
  source: string
  sizes: string
  priority?: boolean
  hero?: boolean
  className?: string
  cartel?: boolean
  style?: CSSProperties
}

export function Hung({ a, source, sizes, priority, hero, className = '', cartel = true, style }: Props) {
  const openArtwork = useOpenArtwork()
  const m = image(a.image)
  return (
    <figure
      className={`hung ${className}`}
      data-id={a.id}
      id={source === 'walk' ? `piece-${a.id}` : undefined}
      style={{ '--w': a.lCm, '--h': a.hCm, '--ratio': m.ratio, ...style } as CSSProperties}
    >
      <button type="button" className="hung__hit" onClick={() => openArtwork(a.id, source)} aria-label={`Regarder « ${a.titre} » de ${a.artiste}`}>
        <PictureLamp className="hung__lamp" />
        <span className="hung__glow" aria-hidden />
        <motion.span className="hung__frame" layoutId={layoutIdFor(a.id, source)} transition={{ type: 'spring', bounce: 0, duration: 0.55 }}>
          <Picture slug={a.image} alt={`${a.titre}, ${a.artiste}, ${a.annee}`} sizes={sizes} fit="contain" priority={priority} hero={hero} />
        </motion.span>
      </button>
      {cartel && (
        <figcaption className="hung__caption">
          <Cartel a={a} />
          <DotToggle id={a.id} titre={a.titre} />
        </figcaption>
      )}
    </figure>
  )
}
