// Accès typé au manifeste généré par scripts/build-images.mjs.
import manifest from './images.gen.json'

export type ImageMeta = {
  slug: string
  w: number
  h: number
  ratio: number
  widths: number[]
  color: string
  lqip: string
}

type Raw = Omit<ImageMeta, 'slug' | 'ratio'>
const M = manifest as Record<string, Raw>

export const IMG_BASE = `${import.meta.env.BASE_URL}img/gen/`

export function image(slug: string): ImageMeta {
  const m = M[slug]
  if (!m) throw new Error(`Image inconnue : « ${slug} ». Lancez npm run images.`)
  return { ...m, slug, ratio: m.w / m.h }
}

export function srcset(slug: string, format: 'avif' | 'webp') {
  return image(slug).widths.map(w => `${IMG_BASE}${slug}-${w}.${format} ${w}w`).join(', ')
}

/** URL d’une déclinaison, la plus proche de `largeur` sans la dépasser de trop. */
export function src(slug: string, largeur = 1280, format: 'avif' | 'webp' = 'webp') {
  const { widths } = image(slug)
  const w = widths.find(x => x >= largeur) ?? widths[widths.length - 1]
  return `${IMG_BASE}${slug}-${w}.${format}`
}
