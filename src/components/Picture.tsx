// Image responsive : AVIF + WebP, dimensions réservées (pas de saut de mise en page),
// aperçu flou pendant le chargement, fondu à l’arrivée.
import { useState, type CSSProperties } from 'react'
import { image, srcset, src } from '../content/images'

type Props = {
  slug: string
  alt: string
  sizes: string
  className?: string
  /** image prioritaire (au-dessus de la ligne de flottaison) */
  priority?: boolean
  /** recadrage : 'cover' (vignettes) ou 'contain' (œuvres, jamais recadrées) */
  fit?: 'cover' | 'contain'
  position?: string
  style?: CSSProperties
  /** respecter le ratio de l’image (sinon le parent impose la forme) */
  ratio?: boolean
  /** image du seuil, attendue par l’ouverture des persiennes */
  hero?: boolean
}

export function Picture({ slug, alt, sizes, className = '', priority, fit = 'cover', position, style, ratio = true, hero }: Props) {
  const m = image(slug)
  const [loaded, setLoaded] = useState(false)
  return (
    <picture
      className={`pic ${loaded ? 'is-loaded' : ''} ${className}`}
      style={{
        aspectRatio: ratio ? `${m.w} / ${m.h}` : undefined,
        backgroundColor: m.color,
        backgroundImage: `url(${m.lqip})`,
        ...style,
      }}
    >
      <source type="image/avif" srcSet={srcset(slug, 'avif')} sizes={sizes} />
      <img
        src={src(slug, 1280)}
        srcSet={srcset(slug, 'webp')}
        sizes={sizes}
        width={m.w}
        height={m.h}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
        data-hero={hero ? '' : undefined}
        style={{ objectFit: fit, objectPosition: position }}
        ref={el => {
          if (el?.complete && el.naturalWidth && !loaded) setLoaded(true)
        }}
        onLoad={() => setLoaded(true)}
      />
    </picture>
  )
}
