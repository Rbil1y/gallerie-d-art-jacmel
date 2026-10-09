// Typographie française : espaces fines insécables, apostrophes, prix, dimensions.

const FINE = ' '
const INSECABLE = ' '

/**
 * Applique les espaces fines avant ; ! ? et à l’intérieur des guillemets,
 * l’espace insécable avant les deux-points, et l’apostrophe typographique.
 */
export function fr(s: string) {
  return s
    .replace(/'/g, '’')
    .replace(/ ([;!?])/g, `${FINE}$1`)
    .replace(/ :/g, `${INSECABLE}:`)
    .replace(/« /g, `«${FINE}`)
    .replace(/ »/g, `${FINE}»`)
}

const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** 4200 → « 4 200 $ » */
export function prix(n: number) {
  return `${nombre.format(n).replace(/\s/g, FINE)}${INSECABLE}$`
}

/** (120, 140) → « 120 × 140 cm » (hauteur × largeur) */
export function dimensions(h: number, l: number) {
  return `${nombre.format(h)}${INSECABLE}×${INSECABLE}${nombre.format(l)}${INSECABLE}cm`
}

/** « n° 004 » */
export function numero(id: string) {
  return `n°${INSECABLE}${id}`
}

/** 1 → « 1 œuvre », 3 → « 3 œuvres » */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`) {
  return `${n}${INSECABLE}${n > 1 ? plurielForme : singulier}`
}
