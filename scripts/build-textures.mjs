// Cuit les matières de la façade (bois peint écaillé, enduit à la chaux) en tuiles sans raccord.
// → src/assets/textures/*.webp, versionnées avec le site. À relancer seulement pour changer une matière :
//   npm run textures
import sharp from 'sharp'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'assets', 'textures')
await mkdir(OUT, { recursive: true })

const TAU = Math.PI * 2
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

function hasard(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bruit de gradient périodique : se raccorde tous les (px, py) entiers. */
function bruit(seed) {
  const r = hasard(seed)
  const perm = Uint16Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  const gx = new Float32Array(256)
  const gy = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const a = r() * TAU
    gx[i] = Math.cos(a)
    gy[i] = Math.sin(a)
  }
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10)
  return (x, y, px, py) => {
    const X = Math.floor(x)
    const Y = Math.floor(y)
    const fx = x - X
    const fy = y - Y
    const dot = (i, j, dx, dy) => {
      const k = perm[(perm[((i % px) + px) % px & 255] + ((j % py) + py) % py) & 255]
      return gx[k] * dx + gy[k] * dy
    }
    const u = fade(fx)
    const v = fade(fy)
    return lerp(lerp(dot(X, Y, fx, fy), dot(X + 1, Y, fx - 1, fy), u), lerp(dot(X, Y + 1, fx, fy - 1), dot(X + 1, Y + 1, fx - 1, fy - 1), u), v) * 1.5
  }
}

function fbm(n, u, v, fx, fy, octaves) {
  let s = 0
  let a = 1
  let t = 0
  for (let o = 0; o < octaves; o++) {
    s += a * n(u * fx, v * fy, fx, fy)
    t += a
    a *= 0.5
    fx *= 2
    fy *= 2
  }
  return s / t
}

const bruits = (seed, count) => Array.from({ length: count }, (_, i) => bruit(seed + i * 97))

/** Éclaire un relief par un soleil venant du haut à gauche et applique l’ombrage à la couleur. */
function eclairer(N, alb, H, kx, ky) {
  const out = Buffer.alloc(N * N * 3)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x
      const gauche = H[y * N + ((x + N - 1) % N)]
      const droite = H[y * N + ((x + 1) % N)]
      const haut = H[((y + N - 1) % N) * N + x]
      const bas = H[((y + 1) % N) * N + x]
      const ombre = 1 + clamp((gauche - droite) * kx + (haut - bas) * ky, -0.42, 0.46)
      for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(clamp(alb[i * 3 + c] * ombre) * 255)
    }
  }
  return out
}

function transposer(N, alb, H) {
  const a2 = new Float32Array(alb.length)
  const h2 = new Float32Array(H.length)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = y * N + x
      const d = x * N + y
      h2[d] = H[s]
      for (let c = 0; c < 3; c++) a2[d * 3 + c] = alb[s * 3 + c]
    }
  }
  return [a2, h2]
}

/** Bois peint : fil horizontal, couche turquoise fanée, sous-couche ocre, bois nu aux éclats. */
function boisPeint(N) {
  const alb = new Float32Array(N * N * 3)
  const H = new Float32Array(N * N)
  const [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12] = bruits(4021, 12)
  const SOMBRE = [0.18, 0.46, 0.44]
  const FANE = [0.4, 0.63, 0.59]
  const OCRE = [0.72, 0.63, 0.45]
  const GRIS = [0.31, 0.27, 0.22]
  const CLAIR = [0.55, 0.48, 0.38]
  const SEL = [0.86, 0.89, 0.85]
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N
      const v = y / N
      const vw = (v + fbm(n1, u, v, 2, 3, 2) * 0.016 + 1) % 1
      const fil = fbm(n2, u, vw, 3, 96, 4)
      const fin = n3(u * 10, vw * 380, 10, 380)
      const cernes = Math.sin(TAU * (vw * 17 + 0.7 * fbm(n4, u, v, 2, 3, 2)))
      const pores = smooth(0.2, 0.6, n5(u * 60, v * 520, 60, 520))
      const bois = 0.6 * fil + 0.16 * fin + 0.1 * cernes - 0.22 * pores
      const pinceau = fbm(n6, u, v, 7, 210, 3)
      const amas = fbm(n7, u, v, 3, 3, 3)
      const usure = fbm(n8, u, v, 6, 70, 5) + 0.1 * n9(u * 50, v * 220, 50, 220) + 0.26 * fil
      const seuil = 0.34 - amas * 0.36
      const c1 = smooth(seuil, seuil + 0.025, usure)
      const c2 = smooth(seuil + 0.045, seuil + 0.07, usure)
      const fane = fbm(n10, u, v, 2, 9, 3)
      const sale = smooth(-0.1, 0.5, fbm(n11, u, v, 5, 11, 4))
      const sel = smooth(0.62, 0.85, n12(u * 120, v * 120, 120, 120)) * smooth(0, 0.6, amas)

      let peint = mix(SOMBRE, FANE, 0.18 + smooth(-0.35, 0.45, fane) * 0.42)
      const creux = 1 - 0.34 * Math.max(0, -bois) + pinceau * 0.1 + fil * 0.08
      peint = peint.map(c => c * creux)
      const ocre = OCRE.map(c => c * (0.92 + 0.2 * (fil + 0.4)))
      const nu = mix(GRIS, CLAIR, smooth(-0.4, 0.4, fil))
      let c = mix(mix(peint, ocre, c1), nu, c2)
      c = c.map(k => k * (1 - 0.16 * sale))
      c = mix(c, SEL, sel * 0.16)

      const i = y * N + x
      alb[i * 3] = c[0]
      alb[i * 3 + 1] = c[1]
      alb[i * 3 + 2] = c[2]
      H[i] = bois * (0.3 + 0.5 * c1) + pinceau * 0.2 * (1 - c1) + (1 - c1) * 0.26 + (1 - c2) * 0.1
    }
  }
  return [alb, H]
}

/** Enduit à la chaux, neutre (posé en « multiply » sur la teinte du mur, de la pierre, du tableau). */
function enduit(N) {
  const alb = new Float32Array(N * N * 3)
  const H = new Float32Array(N * N)
  const [n1, n2, n3, n4, n5, n6, n7, n8, n9] = bruits(7717, 9)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N
      const v = y / N
      const taches = fbm(n1, u, v, 3, 3, 5)
      const brosseH = fbm(n2, u, v, 5, 46, 3)
      const brosseV = fbm(n3, u, v, 46, 5, 3)
      const grain = fbm(n4, u, v, 70, 70, 3)
      const coulure = fbm(n5, u, v, 28, 2, 3)
      const fissure = smooth(0.0045, 0, Math.abs(fbm(n6, u, v, 5, 5, 5))) * smooth(0.14, 0.42, fbm(n7, u, v, 3, 3, 2))
      const eclat = smooth(0.46, 0.53, fbm(n8, u, v, 9, 9, 5) + 0.12 * n9(u * 80, v * 80, 80, 80))
      const val = 0.885 + 0.07 * taches + 0.03 * brosseH + 0.03 * brosseV - 0.06 * Math.max(0, coulure) - 0.3 * fissure - 0.05 * eclat
      const i = y * N + x
      alb[i * 3] = alb[i * 3 + 1] = alb[i * 3 + 2] = val
      H[i] = 0.3 * grain + 0.22 * (brosseH + brosseV) + 0.24 * (1 - eclat) - 0.3 * fissure
    }
  }
  return [alb, H]
}

async function ecrire(nom, N, data, quality) {
  const path = join(OUT, `${nom}.webp`)
  await sharp(data, { raw: { width: N, height: N, channels: 3 } }).webp({ quality, effort: 6 }).toFile(path)
  console.log(`${nom}.webp  ${N}px  ${((await stat(path)).size / 1024).toFixed(0)} Ko`)
}

const NB = 640
const [alb, H] = boisPeint(NB)
await ecrire('peinture-h', NB, eclairer(NB, alb, H, 0.6, 1.05), 66)
const [albV, HV] = transposer(NB, alb, H)
await ecrire('peinture-v', NB, eclairer(NB, albV, HV, 1.05, 0.6), 66)

const NE = 900
const [albE, HE] = enduit(NE)
await ecrire('enduit', NE, eclairer(NE, albE, HE, 0.34, 0.5), 58)

/** Ombre de palmes pré-floutée : aucun filtre à recalculer au moment où la porte s’affiche. */
function palme(x0, y0, len, dir, courbe, r) {
  const n = 34
  let x = x0
  let y = y0
  let a = dir
  const pas = len / n
  let rachis = `M${x.toFixed(1)} ${y.toFixed(1)}`
  let folioles = ''
  for (let i = 1; i <= n; i++) {
    const t = i / n
    a += courbe / n
    x += Math.cos(a) * pas
    y += Math.sin(a) * pas
    rachis += ` L${x.toFixed(1)} ${y.toFixed(1)}`
    if (i < 3) continue
    const L = len * 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (0.8 + r() * 0.4)
    for (const cote of [-1, 1]) {
      const la = a + (1.15 - 0.55 * t) * cote + (r() - 0.5) * 0.25
      const cx = x + Math.cos(la) * L * 0.55
      const cy = y + Math.sin(la) * L * 0.55 - L * 0.05
      const ex = x + Math.cos(la) * L
      const ey = y + Math.sin(la) * L + L * 0.38
      folioles += `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `
    }
  }
  return `<g fill="none" stroke="#000" stroke-linecap="round"><path d="${rachis}" stroke-width="9"/><path d="${folioles}" stroke-width="6"/></g>`
}
const r = hasard(1987)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">${[
  palme(-60, 120, 820, 0.18, 0.9, r),
  palme(-40, 420, 700, -0.12, 0.75, r),
  palme(140, -80, 620, 0.95, 0.55, r),
].join('')}</svg>`
const palmes = join(OUT, 'palmes.webp')
await sharp(Buffer.from(svg)).resize(1000, 1000).blur(2.4).webp({ quality: 38, alphaQuality: 46, effort: 6 }).toFile(palmes)
console.log(`palmes.webp  1000px  ${((await stat(palmes)).size / 1024).toFixed(0)} Ko`)
