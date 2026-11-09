// Prépare la maquette 3D du centre-ville de Jacmel, d’après la carte réelle (OpenStreetMap) :
// la scène (chaque maison à sa vraie place, avec sa vraie forme) et ses matières cuites
// (sol, façades, tôles, ferronnerie, tranches du socle).
// → public/maquette/*. Le rendu se fait en direct dans le navigateur (src/maquette/).
// npm run maquette (les données OSM restent en cache).
import sharp from 'sharp'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ICI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(ICI, '..', '..')
const CACHE = join(ROOT, 'node_modules', '.cache', 'gallerie')
const OSM = join(CACHE, 'osm-jacmel.json')
const OUT = join(ROOT, 'public', 'maquette')
mkdirSync(OUT, { recursive: true })

// La maison : mêmes coordonnées que la fiche du site. Le cadre : Marché en fer, rue du Commerce, Douane, wharf, baie.
const LAT0 = 18.2342
const LON0 = -72.5347
const VUE = { cx: +(process.env.CX ?? -95), cy: +(process.env.CY ?? -175), B: +(process.env.B ?? 440), angle: +(process.env.ANGLE ?? 50) }
const M = 2048 // résolution du sol
const SMAX = 160 // portée de la distance à la côte, en mètres

// ---------- outils ----------
const TAU = Math.PI * 2
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const hache = (a, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const hasard = seed => {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
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
  return (x, y) => {
    const X = Math.floor(x)
    const Y = Math.floor(y)
    const fx = x - X
    const fy = y - Y
    const dot = (i, j, dx, dy) => {
      const k = perm[(perm[i & 255] + j) & 255]
      return gx[k] * dx + gy[k] * dy
    }
    const u = fade(fx)
    const v = fade(fy)
    return lerp(lerp(dot(X, Y, fx, fy), dot(X + 1, Y, fx - 1, fy), u), lerp(dot(X, Y + 1, fx, fy - 1), dot(X + 1, Y + 1, fx - 1, fy - 1), u), v) * 1.5
  }
}
const fbm = (n, x, y, oct = 3) => {
  let s = 0
  let a = 1
  let t = 0
  for (let o = 0; o < oct; o++) {
    s += a * n(x, y)
    t += a
    a *= 0.5
    x *= 2.03
    y *= 2.03
  }
  return s / t
}
async function versNormale(h, W, H, force, nom, q = 78) {
  const out = Buffer.alloc(W * H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (h[y * W + ((x + 1) % W)] - h[y * W + ((x + W - 1) % W)]) * force
      const dy = (h[((y + 1) % H) * W + x] - h[((y + H - 1) % H) * W + x]) * force
      const l = Math.hypot(dx, dy, 1)
      const i = (y * W + x) * 3
      out[i] = Math.round((-dx / l) * 127.5 + 127.5)
      out[i + 1] = Math.round((dy / l) * 127.5 + 127.5)
      out[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
    }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: q, effort: 5 }).toFile(join(OUT, nom))
}

// ---------- données ----------
const osm = JSON.parse(readFileSync(OSM, 'utf8'))
const elements = osm.elements.filter(e => e.geometry)
const mx = 111320 * Math.cos((LAT0 * Math.PI) / 180)
const my = 110540
const ca = Math.cos((VUE.angle * Math.PI) / 180)
const sa = Math.sin((VUE.angle * Math.PI) / 180)
/** lat/lon → repère de la maquette : x à droite (la mer), z vers le spectateur. */
const projeter = (lat, lon) => {
  const dx = (lon - LON0) * mx - VUE.cx
  const dy = (lat - LAT0) * my - VUE.cy
  return [ca * dx - sa * dy, -(sa * dx + ca * dy)]
}
const trace = e => e.geometry.map(g => projeter(g.lat, g.lon))
const B = VUE.B
const PX = M / B
const dansSocle = ([x, z], m = 0) => Math.abs(x) < B / 2 - m && Math.abs(z) < B / 2 - m
const versPx = ([x, z]) => [(x / B + 0.5) * M, (z / B + 0.5) * M]
const chemin = (p, ferme) => 'M' + p.map(q => versPx(q).map(v => v.toFixed(1)).join(' ')).join('L') + (ferme ? 'Z' : '')
const indice = ([x, z]) => clamp(Math.floor((z / B + 0.5) * M), 0, M - 1) * M + clamp(Math.floor((x / B + 0.5) * M), 0, M - 1)

async function raster(corps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${M}" height="${M}"><rect width="100%" height="100%" fill="#000"/>${corps}</svg>`
  return sharp(Buffer.from(svg)).greyscale().raw().toBuffer()
}

// ---------- la mer ----------
const cote = new Uint8Array(M * M)
for (const e of elements.filter(e => e.tags.natural === 'coastline')) {
  const p = trace(e)
  for (let i = 1; i < p.length; i++) {
    const n = Math.ceil(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) * PX * 2) + 1
    for (let t = 0; t <= n; t++) {
      const [x, y] = versPx([lerp(p[i - 1][0], p[i][0], t / n), lerp(p[i - 1][1], p[i][1], t / n)])
      if (x >= 0 && y >= 0 && x < M && y < M) cote[Math.floor(y) * M + Math.floor(x)] = 1
    }
  }
}
const mer = new Uint8Array(M * M)
{
  const q = projeter(18.2205, -72.5345)
  const pile = [indice([clamp(q[0], -B / 2 + 3, B / 2 - 3), clamp(q[1], -B / 2 + 3, B / 2 - 3)])]
  while (pile.length) {
    const i = pile.pop()
    if (mer[i] || cote[i]) continue
    mer[i] = 1
    const x = i % M
    if (x > 0) pile.push(i - 1)
    if (x < M - 1) pile.push(i + 1)
    if (i >= M) pile.push(i - M)
    if (i < M * M - M) pile.push(i + M)
  }
}
function distance(marque) {
  const INF = 1e12
  const d = new Float64Array(M * M)
  for (let i = 0; i < M * M; i++) d[i] = marque(i) ? 0 : INF
  const f = new Float64Array(M)
  const v = new Int32Array(M)
  const z = new Float64Array(M + 1)
  const passe = (lire, ecrire) => {
    for (let q = 0; q < M; q++) f[q] = lire(q)
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (let q = 1; q < M; q++) {
      let s
      do {
        const p = v[k]
        s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p)
        if (s <= z[k]) k--
        else break
      } while (k >= 0)
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < M; q++) {
      while (z[k + 1] < q) k++
      const p = v[k]
      ecrire(q, (q - p) * (q - p) + f[p])
    }
  }
  for (let x = 0; x < M; x++) passe(y => d[y * M + x], (y, val) => (d[y * M + x] = val))
  for (let y = 0; y < M; y++) passe(x => d[y * M + x], (x, val) => (d[y * M + x] = val))
  return Float32Array.from(d, Math.sqrt)
}
const dMer = distance(i => mer[i])
const dTerre = distance(i => !mer[i])
const sd = new Float32Array(M * M)
for (let i = 0; i < M * M; i++) sd[i] = (mer[i] ? dTerre[i] : -dMer[i]) / PX
const sdAt = q => sd[indice(q)]

// ---------- rues ----------
const LARGEUR = r => (/trunk|primary/.test(r) ? 11 : /secondary/.test(r) ? 9.5 : /tertiary/.test(r) ? 8.5 : /residential|unclassified|living/.test(r) ? 6.8 : /service|pedestrian/.test(r) ? 4.6 : 3)
const rues = elements
  .filter(e => e.tags.highway)
  .map(e => ({ p: trace(e), l: LARGEUR(e.tags.highway), nom: e.tags.name ?? '', id: e.id }))
  .filter(r => r.p.some(q => dansSocle(q, -40)))
const NOBLES = /commerce|douane|orl[ée]ans|l'?[ée]glise|seymour|magloire|libert|ti batterie|vaivres|val[ie]{1,2}res/i
const trait = (p, w, g) => `<path d="${chemin(p)}" fill="none" stroke="rgb(${g},${g},${g})" stroke-width="${(w * PX).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`
const rasRues = await raster(rues.map(r => trait(r.p, r.l + 3.2, 130)).join('') + rues.map(r => trait(r.p, r.l, 255)).join(''))
const rasNobles = await raster(rues.filter(r => NOBLES.test(r.nom)).map(r => trait(r.p, r.l, 255)).join(''))
const polys = f => elements.filter(f).map(e => `<path d="${chemin(trace(e), true)}" fill="#fff"/>`).join('')
const rasPlage = await raster(polys(e => e.tags.natural === 'beach' || e.tags.natural === 'sand'))
const rasParc = await raster(polys(e => e.tags.leisure === 'park' || e.tags.leisure === 'pitch' || e.tags.landuse === 'grass' || e.tags.landuse === 'cemetery'))
// ---------- les maisons ----------
const aire = p => {
  let s = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length]
    s += p[i][0] * q[1] - q[0] * p[i][1]
  }
  return s / 2
}
const nobles = rues.filter(r => NOBLES.test(r.nom))
const procheNoble = (x, z) => {
  for (const r of nobles)
    for (let i = 1; i < r.p.length; i++) {
      const [ax, az] = r.p[i - 1]
      const [bx, bz] = r.p[i]
      const dx = bx - ax
      const dz = bz - az
      const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))
      if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < 20) return true
    }
  return false
}
const maisons = []
for (const e of elements.filter(e => e.tags.building)) {
  let p = trace(e)
  if (p.length > 3 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 0.01) p = p.slice(0, -1)
  if (!p.every(q => dansSocle(q, 2))) continue
  const a = aire(p)
  if (a < 0) p.reverse() // ainsi la normale sortante d’une arête est (dz, −dx)
  const surface = Math.abs(a)
  if (surface < 7) continue
  let cx = 0
  let cz = 0
  for (const q of p) {
    cx += q[0]
    cz += q[1]
  }
  cx /= p.length
  cz /= p.length
  const r = hache(e.id % 104729)
  const noble = procheNoble(cx, cz)
  const nom = e.tags.name ?? ''
  let type = 0 // 0 maison, 1 marché, 2 douane, 3 institution
  if (/march[ée] en fer/i.test(nom)) type = 1
  else if (/douane/i.test(nom)) type = 2
  else if (nom || e.tags.amenity) type = 3
  let etages = +(e.tags['building:levels'] ?? 0)
  if (!etages) etages = surface < 36 ? 1 : noble ? (r < 0.76 ? 2 : 1) : type === 3 ? 2 : r < 0.12 ? 2 : 1
  etages = clamp(Math.round(etages), 1, 3)
  // chaque arête : donne-t-elle sur une rue ?
  const surRue = p.map((q, i) => {
    const s = p[(i + 1) % p.length]
    const l = Math.hypot(s[0] - q[0], s[1] - q[1]) || 1
    const nx = (s[1] - q[1]) / l
    const nz = -(s[0] - q[0]) / l
    const mid = [(q[0] + s[0]) / 2, (q[1] + s[1]) / 2]
    let v = 0
    for (const d of [2, 4, 7, 10]) v = Math.max(v, rasRues[indice([mid[0] + nx * d, mid[1] + nz * d])])
    return v > 100 ? 1 : 0
  })
  maisons.push({ p: p.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]), c: [+cx.toFixed(2), +cz.toFixed(2)], s: +surface.toFixed(1), e: etages, r: +r.toFixed(4), n: noble ? 1 : 0, t: type, f: surRue, id: e.id })
}

const empreintes = maisons.map(m => `<path d="${chemin(m.p, true)}" fill="#fff"/>`).join('')
const rasBati = await raster(empreintes)
const ao1 = await sharp(rasBati, { raw: { width: M, height: M, channels: 1 } }).blur(1.3 * PX).greyscale().raw().toBuffer()
const ao2 = await sharp(rasBati, { raw: { width: M, height: M, channels: 1 } }).blur(4.5 * PX).greyscale().raw().toBuffer()
const occupe = await raster(maisons.map(m => `<path d="${chemin(m.p, true)}" fill="#fff" stroke="#fff" stroke-width="${(3 * PX).toFixed(1)}"/>`).join(''))

// ---------- arbres, palmiers, canots, véhicules ----------
const r = hasard(1804)
const libre = q => !occupe[indice(q)] && rasRues[indice(q)] < 60
const parc = q => rasParc[indice(q)] > 128
const plage = q => rasPlage[indice(q)] > 128
const arbres = []
const palmiers = []
for (let i = 0; i < 12000; i++) {
  const q = [(r() - 0.5) * (B - 6), (r() - 0.5) * (B - 6)]
  const s = sdAt(q)
  const t = r()
  const u = r()
  if (s > -3 || !libre(q) || plage(q)) continue
  const dens = (parc(q) ? 0.26 : s > -46 ? 0.022 : 0.07) * (procheNoble(q[0], q[1]) ? 0.3 : 1)
  if (t < dens * 0.3) palmiers.push([+q[0].toFixed(1), +q[1].toFixed(1), +(u * 6.28).toFixed(2), +(0.8 + hache(i) * 0.5).toFixed(2)])
  else if (t < dens) arbres.push([+q[0].toFixed(1), +q[1].toFixed(1), +(2.2 + u * u * 3.2).toFixed(2), +hache(i, 2).toFixed(3)])
}
for (let i = 0; i < 2600; i++) {
  const q = [(r() - 0.5) * (B - 6), (r() - 0.5) * (B - 6)]
  const s = sdAt(q)
  const u = r()
  if (s > -2 || s < -22 || !libre(q) || u > 0.11) continue
  palmiers.push([+q[0].toFixed(1), +q[1].toFixed(1), +(u * 28).toFixed(2), +(0.9 + hache(i, 4) * 0.5).toFixed(2)])
}
const canots = []
for (let i = 0; i < 9000 && canots.length < 16; i++) {
  const q = [(r() - 0.5) * (B - 16), (r() - 0.5) * (B - 16)]
  const s = sdAt(q)
  const a = r() * 6.28
  const c = r()
  const surSable = plage(q) && s < -1 && s > -14
  const auMouillage = s > 14 && s < 120 && c < 0.2
  if (!surSable && !auMouillage) continue
  canots.push([+q[0].toFixed(1), +q[1].toFixed(1), +a.toFixed(2), +c.toFixed(3), s > 0 ? 1 : 0])
}
const vehicules = []
for (const rue of rues.filter(x => x.l >= 6.8)) {
  for (let i = 1; i < rue.p.length; i++) {
    const [ax, az] = rue.p[i - 1]
    const [bx, bz] = rue.p[i]
    const l = Math.hypot(bx - ax, bz - az)
    let d = 8 + r() * 26
    while (d < l - 5) {
      const q = [lerp(ax, bx, d / l), lerp(az, bz, d / l)]
      const ang = Math.atan2(bz - az, bx - ax)
      const lat = rue.l * 0.26 * (r() < 0.5 ? -1 : 1)
      const c = r()
      const p2 = [q[0] - Math.sin(ang) * lat, q[1] + Math.cos(ang) * lat]
      if (dansSocle(p2, 5) && sdAt(p2) < -4) vehicules.push([+p2[0].toFixed(1), +p2[1].toFixed(1), +ang.toFixed(3), +c.toFixed(3)])
      d += 24 + r() * 62
    }
  }
}
const lampes = []
for (const rue of rues.filter(x => x.l >= 4.6)) {
  for (let i = 1; i < rue.p.length; i++) {
    const [ax, az] = rue.p[i - 1]
    const [bx, bz] = rue.p[i]
    const l = Math.hypot(bx - ax, bz - az)
    for (let d = r() * 10; d < l; d += 14 + r() * 13) {
      const q = [lerp(ax, bx, d / l), lerp(az, bz, d / l)]
      if (dansSocle(q, 2) && sdAt(q) < -1) lampes.push([q[0], q[1], r()])
    }
  }
}
const wharf = rues.filter(x => x.p.some(q => dansSocle(q, 1) && sdAt(q) > 5)).map(x => x.p.map(q => [+q[0].toFixed(1), +q[1].toFixed(1)]))

// relief : la ville monte doucement vers l’intérieur des terres
const GR = 128
const relief = []
for (let j = 0; j <= GR; j++)
  for (let i = 0; i <= GR; i++) {
    const x = (i / GR - 0.5) * B
    const z = (j / GR - 0.5) * B
    const s = sdAt([clamp(x, -B / 2 + 0.1, B / 2 - 0.1), clamp(z, -B / 2 + 0.1, B / 2 - 0.1)])
    const h = s > 0 ? 0 : 0.5 * smooth(0, 16, -s) + 0.0085 * Math.max(0, -s - 16) + 0.009 * (B / 2 - x) * smooth(0, 40, -s)
    relief.push(+h.toFixed(2))
  }

// la galerie : la maison la plus proche des coordonnées de la fiche
const [ox, oz] = [-18, 34] // cœur de la maquette ; la rue Barranquilla n’est pas nommée sur OpenStreetMap
let galerie = maisons[0]
{
  let best = Infinity
  for (const m of maisons) {
    const d = Math.hypot(m.c[0] - ox, m.c[1] - oz) + (m.s < 90 ? 30 : 0) + (m.t ? 200 : 0) + (m.n && m.f.some(Boolean) ? 0 : 200)
    if (d < best) {
      best = d
      galerie = m
    }
  }
  galerie.e = 2
  galerie.g = 1
  galerie.n = 1
}
// clôtures maçonnées le long des rues, là où il n’y a pas de maison : elles tiennent l’alignement de la ville
const clotures = []
for (const rue of rues.filter(x => x.l >= 4.6)) {
  for (const cote_ of [-1, 1]) {
    const off = rue.l / 2 + 2.3
    let run = []
    const fin = () => {
      if (run.length > 4 && r() < 0.78) clotures.push({ p: run.filter((_, k) => k % 2 === 0 || k === run.length - 1).map(q => [+q[0].toFixed(1), +q[1].toFixed(1)]), h: +(1.5 + r() * 0.9).toFixed(2), c: +r().toFixed(3) })
      run = []
    }
    for (let i = 1; i < rue.p.length; i++) {
      const [ax, az] = rue.p[i - 1]
      const [bx, bz] = rue.p[i]
      const l = Math.hypot(bx - ax, bz - az)
      const nx = -(bz - az) / (l || 1)
      const nz = (bx - ax) / (l || 1)
      for (let d = 0; d < l; d += 1.5) {
        const q = [lerp(ax, bx, d / l) + nx * off * cote_, lerp(az, bz, d / l) + nz * off * cote_]
        const ok = dansSocle(q, 3) && !occupe[indice(q)] && rasRues[indice(q)] < 60 && sdAt(q) < -4 && !plage(q) && !parc(q)
        if (ok) run.push(q)
        else fin()
      }
    }
    fin()
  }
}
// passants et poteaux électriques
const gens = []
const poteaux = []
for (const rue of rues.filter(x => x.l >= 4.6)) {
  const noble = NOBLES.test(rue.nom)
  const ligne = []
  let reste = 6
  for (let i = 1; i < rue.p.length; i++) {
    const [ax, az] = rue.p[i - 1]
    const [bx, bz] = rue.p[i]
    const l = Math.hypot(bx - ax, bz - az)
    const nx = -(bz - az) / (l || 1)
    const nz = (bx - ax) / (l || 1)
    for (let d = r() * 6; d < l; d += noble ? 2.4 + r() * 5 : 7 + r() * 16) {
      const c = r() < 0.5 ? -1 : 1
      const off = rue.l / 2 + 0.5 + r() * 0.9
      const q = [lerp(ax, bx, d / l) + nx * off * c, lerp(az, bz, d / l) + nz * off * c]
      if (dansSocle(q, 3) && sdAt(q) < -3 && !occupe[indice(q)]) gens.push([+q[0].toFixed(1), +q[1].toFixed(1), +r().toFixed(3)])
    }
    for (let d = reste; d < l; d += 24) {
      const q = [lerp(ax, bx, d / l) + nx * (rue.l / 2 + 1.1), lerp(az, bz, d / l) + nz * (rue.l / 2 + 1.1)]
      if (dansSocle(q, 3) && sdAt(q) < -3 && !occupe[indice(q)]) ligne.push([+q[0].toFixed(1), +q[1].toFixed(1)])
      reste = d + 24 - l
    }
  }
  if (ligne.length > 1) poteaux.push(ligne)
}
writeFileSync(join(OUT, 'donnees.json'), JSON.stringify({ B, SMAX, GR, relief, maisons, arbres, palmiers, canots, vehicules, wharf, clotures, gens, poteaux, angle: VUE.angle, galerie: galerie.c }))
console.log(`${clotures.length} clôtures, ${gens.length} passants, ${poteaux.length} lignes électriques`)
{
  const gen = join(ROOT, 'src', 'content', 'maquette.gen.json')
  const avant = existsSync(gen) ? JSON.parse(readFileSync(gen, 'utf8')) : { point: [0.5, 0.5] }
  writeFileSync(gen, JSON.stringify({ ...avant, maisons: maisons.length }) + String.fromCharCode(10))
}
console.log(`${maisons.length} maisons (${maisons.filter(m => m.n).length} sur rues nobles, ${maisons.filter(m => m.t === 1).length} marché, ${maisons.filter(m => m.t === 2).length} douane), ${arbres.length} arbres, ${palmiers.length} palmiers, ${canots.length} canots, ${vehicules.length} véhicules, galerie ${galerie.c}`)

// ---------- le sol ----------
if (!process.env.SANS_SOL) {
  const n1 = bruit(11)
  const n2 = bruit(23)
  const n3 = bruit(37)
  const n4 = bruit(53)
  const n5 = bruit(71)
  const alb = Buffer.alloc(M * M * 3)
  const rug = Buffer.alloc(M * M)
  const H = new Float32Array(M * M)
  const TURQ = hex('#86d8c8')
  const LAGON = hex('#2fa3ae')
  const BLEU = hex('#13739b')
  const LARGE = hex('#0b3f70')
  const ABYSSE = hex('#072547')
  const ECUME = hex('#f4f6ee')
  const TERRE = hex('#8f7a5e')
  const TERRE2 = hex('#7a6950')
  const HERBE = hex('#566a3a')
  const GAZON = hex('#6d8c45')
  const SABLE = hex('#5d5852')
  const SABLE2 = hex('#857d70')
  const TROT = hex('#d4cab6')
  const CHAUS = hex('#aba08e')
  const BRIQUE = hex('#a8704f')
  const BRIQUE2 = hex('#8f5c44')
  // masques adoucis : ils servent de couverture pour peindre le sol, sans déplacer aucun objet
  const adoucir = b => sharp(b, { raw: { width: M, height: M, channels: 1 } }).blur(0.7).greyscale().raw().toBuffer()
  const [solRues, solNobles, solPlage, solParc] = await Promise.all([rasRues, rasNobles, rasPlage, rasParc].map(adoucir))
  for (let y = 0; y < M; y++) {
    for (let x = 0; x < M; x++) {
      const i = y * M + x
      const s = sd[i]
      const wx = x / PX
      const wz = y / PX
      let c
      let h = 0
      let rg = 0.95
      if (s > 0) {
        const dp = s + fbm(n1, wx * 0.014, wz * 0.014, 3) * 20
        c = dp < 14 ? mix(TURQ, LAGON, smooth(0, 14, dp)) : dp < 50 ? mix(LAGON, BLEU, smooth(14, 50, dp)) : dp < 110 ? mix(BLEU, LARGE, smooth(50, 110, dp)) : mix(LARGE, ABYSSE, smooth(110, 170, dp))
        const brise = fbm(n2, wx * 0.07, wz * 0.07, 3)
        const f = smooth(6.5, 1, s + brise * 5)
        const train = smooth(0.55, 0.92, Math.sin((s + brise * 7) * 0.62) * 0.5 + 0.5) * smooth(22, 8, s) * smooth(-0.05, 0.3, fbm(n4, wx * 0.09, wz * 0.09, 2) + 0.16)
        c = mix(c, ECUME, clamp(f * 0.95 + train * 0.55))
        const onde = fbm(n3, wx * 0.08, wz * 0.15, 3)
        h = onde * 2.2 + f * 3 + train * 1.4
        rg = 0.06 + clamp(f + train) * 0.55
      } else {
        // chaque matière est posée selon sa couverture : un seuil par texel dessinerait des dents en gros plan
        const g = solRues[i]
        const wear = fbm(n1, wx * 0.09, wz * 0.09, 3)
        const fine = n5(wx * 1.1, wz * 1.1)
        const poser = (cc, hh, rr, w) => {
          c = mix(c, cc, w)
          h = lerp(h, hh, w)
          rg = lerp(rg, rr, w)
        }
        c = mix(TERRE, TERRE2, smooth(-0.4, 0.4, wear))
        c = mix(c, HERBE, smooth(-0.2, 0.24, fbm(n3, wx * 0.075, wz * 0.075, 3)) * 0.9)
        h = fine * 0.8
        rg = 1
        const wParc = solParc[i] / 255
        if (wParc > 0) poser(mix(GAZON, HERBE, smooth(-0.3, 0.4, wear + fine * 0.3)), fine * 0.9, 1, wParc)
        const wPlage = solPlage[i] / 255
        if (wPlage > 0) poser(mix(SABLE, SABLE2, smooth(-0.3, 0.3, wear + fine * 0.2) * smooth(16, 2, -s + 8)), fine * 0.5, 0.9, wPlage)
        // le trottoir vaut 130 dans le masque des rues, la chaussée 255
        const wTrot = clamp(g / 120)
        if (wTrot > 0) {
          const dalle = Math.min(Math.abs((wz * 0.9) % 1), Math.abs((wx * 0.9) % 1))
          poser(mix(mix(TROT, [188, 178, 158], smooth(-0.3, 0.4, wear)), [120, 112, 98], smooth(0.08, 0.02, dalle) * 0.5), 0.7 + fine * 0.15, 0.88, wTrot)
        }
        const wRue = clamp((g - 140) / 105)
        if (wRue > 0) {
          let cr = mix(CHAUS, [150, 140, 125], smooth(-0.35, 0.4, wear))
          cr = mix(cr, [128, 120, 108], smooth(0.2, 0.26, fbm(n4, wx * 0.11, wz * 0.11, 2)) * 0.7)
          let hr = -0.5 + fine * 0.3
          // atteint sa pleine valeur avant la chaussée, pour ne pas laisser de liseré gris le long des pavés
          const wNoble = clamp(solNobles[i] / 90)
          if (wNoble > 0) {
            // pavés posés à la main
            const lig = Math.floor(wz * 1.05)
            const col = Math.floor(wx * 0.62 + (lig % 2) * 0.5)
            const joint = Math.min(Math.abs((wz * 1.05) % 1), Math.abs((wx * 0.62 + (lig % 2) * 0.5) % 1))
            cr = mix(cr, mix(mix(BRIQUE, BRIQUE2, hache(col, lig)), [70, 58, 48], smooth(0.1, 0.02, joint) * 0.55), wNoble)
            hr = lerp(hr, -0.5 + smooth(0.02, 0.14, joint) * 1.1, wNoble)
          }
          poser(cr, hr, 0.82, wRue)
        }
        const contact = 1 - 0.58 * clamp((ao1[i] / 255) * 2.3) - 0.26 * clamp((ao2[i] / 255) * 2.2)
        c = [c[0] * contact, c[1] * contact, c[2] * contact]
      }
      H[i] = h
      alb[i * 3] = clamp(c[0], 0, 255)
      alb[i * 3 + 1] = clamp(c[1], 0, 255)
      alb[i * 3 + 2] = clamp(c[2], 0, 255)
      rug[i] = Math.round(clamp(rg) * 255)
    }
  }
  await sharp(alb, { raw: { width: M, height: M, channels: 3 } }).webp({ quality: 74, effort: 5 }).toFile(join(OUT, 'sol.webp'))
  await sharp(rug, { raw: { width: M, height: M, channels: 1 } }).resize(1024).webp({ quality: 70, effort: 5 }).toFile(join(OUT, 'sol-rugosite.webp'))
  await versNormale(H, M, M, 0.42, 'sol-normale.webp', 70)
  // réverbères : flaques de lumière chaude, pour la nuit
  const E = 1024
  const lum = new Float32Array(E * E)
  const R = Math.round((9 / B) * E)
  for (const [x, z, k] of lampes) {
    const cx = (x / B + 0.5) * E
    const cy = (z / B + 0.5) * E
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j) / R
        if (d >= 1) continue
        const px = Math.round(cx + i)
        const py = Math.round(cy + j)
        if (px < 0 || py < 0 || px >= E || py >= E) continue
        lum[py * E + px] += (1 - d) * (1 - d) * (0.55 + k * 0.45)
      }
  }
  const ems = Buffer.alloc(E * E * 3)
  for (let i = 0; i < E * E; i++) {
    const l = clamp(lum[i] * 0.8)
    ems[i * 3] = Math.round(255 * l)
    ems[i * 3 + 1] = Math.round(176 * l)
    ems[i * 3 + 2] = Math.round(92 * l)
  }
  await sharp(ems, { raw: { width: E, height: E, channels: 3 } }).webp({ quality: 60, effort: 5 }).toFile(join(OUT, 'sol-lumiere.webp'))

  // tranches du socle : strates de terre, ou résine et sable, selon ce que coupe le bord
  const TW = 2048
  const TH = 128
  const cotes = Buffer.alloc(TW * TH * 4 * 3)
  const bords = [(u, _) => [(u - 0.5) * B, B / 2 - 0.5], (u, _) => [B / 2 - 0.5, (0.5 - u) * B], (u, _) => [(0.5 - u) * B, -B / 2 + 0.5], (u, _) => [-B / 2 + 0.5, (u - 0.5) * B]]
  const nS = bruit(101)
  const STR = ['#3b2c20', '#5b4630', '#83684a', '#a78a63', '#c9b48e', '#8e7a5e', '#6d5a44'].map(hex)
  for (let b = 0; b < 4; b++) {
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const u = x / TW
        const v = y / TH
        const s = sdAt(bords[b](u, 0))
        let c
        if (s > 0) {
          const fond = 0.76 + fbm(nS, u * 18 + b * 3, 0.5, 3) * 0.1
          if (v > fond) c = mix(hex('#c9b78f'), hex('#8f7d5c'), smooth(fond, 1, v) + nS(u * 300, v * 60) * 0.2)
          else c = mix(mix(hex('#2aa0ad'), hex('#0d5583'), smooth(0, 0.32, v)), hex('#072a52'), smooth(0.25, fond, v))
          if (hache(Math.floor(u * 700), Math.floor(v * 90) + b) > 0.9965 && v < fond) c = mix(c, [235, 245, 245], 0.55)
        } else {
          const w = v * 6.2 + fbm(nS, u * 9 + b * 5, v * 3, 3) * 1.15
          const k = clamp(Math.floor(w), 0, STR.length - 2)
          c = mix(STR[k], STR[k + 1], smooth(0.2, 0.8, w - k))
          const grain = nS(u * 900, v * 120)
          c = c.map(q => q * (1 + grain * 0.14))
          if (v < 0.05) c = mix(c, hex('#4f6b34'), 0.7)
          if (hache(Math.floor(u * 260), Math.floor(v * 26) + b * 7) > 0.975) c = mix(c, hex('#d8cfbd'), 0.6)
        }
        const i = ((b * TH + y) * TW + x) * 3
        cotes[i] = clamp(c[0], 0, 255)
        cotes[i + 1] = clamp(c[1], 0, 255)
        cotes[i + 2] = clamp(c[2], 0, 255)
      }
    }
  }
  await sharp(cotes.subarray(0, TW * TH * 4 * 3), { raw: { width: TW, height: TH * 4, channels: 3 } }).webp({ quality: 78, effort: 5 }).toFile(join(OUT, 'cotes.webp'))
}

// ---------- les façades : atlas de travées (8 × 8 tuiles de 256 px, une travée sur un étage) ----------
const T = 256
const MURS = ['#e9dcc0', '#dcb67c', '#dc9c7e', '#a9d0ba', '#82bfb8', '#a8c6da', '#e8d384', '#f0eadd']
const VOLETS = ['#2e8c86', '#3f7a4a', '#2f5f96', '#8a3a2e', '#e9e4d6', '#2e8c86', '#245a78', '#b5823b']
const sombre = (h, k) => {
  const c = hex(h)
  return `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`
}
let A = ''
let Hh = ''
let Em = ''
let X0 = 0
let Y0 = 0
const gris = g => `rgb(${g},${g},${g})`
const R = (x, y, w, h, f, g, e) => {
  A += `<rect x="${X0 + x}" y="${Y0 + y}" width="${w}" height="${h}" fill="${f}"/>`
  if (g != null) Hh += `<rect x="${X0 + x}" y="${Y0 + y}" width="${w}" height="${h}" fill="${gris(g)}"/>`
  if (e) Em += `<rect x="${X0 + x}" y="${Y0 + y}" width="${w}" height="${h}" fill="${e}"/>`
}
const Pth = (d, f, g, e) => {
  const t = `transform="translate(${X0} ${Y0})"`
  A += `<path ${t} d="${d}" fill="${f}"/>`
  if (g != null) Hh += `<path ${t} d="${d}" fill="${gris(g)}"/>`
  if (e) Em += `<path ${t} d="${d}" fill="${e}"/>`
}
function persiennes(x, y, w, h, col, lumiere) {
  R(x, y, w, h, sombre(col, 0.55), 70)
  const pas = 7
  for (let yy = y + 2; yy < y + h - 3; yy += pas) {
    R(x + 2, yy, w - 4, 3.2, col, 118, lumiere ? null : null)
    R(x + 2, yy + 3.2, w - 4, 2.2, sombre(col, 1.2), 150)
    R(x + 2, yy + 5.4, w - 4, 1.6, sombre(col, 0.3), 56, lumiere)
  }
  R(x, y, 3, h, sombre(col, 0.85), 150)
  R(x + w - 3, y, 3, h, sombre(col, 0.75), 150)
}
const FEUTRE = '#fff0d0'
function porte(mur, volet, lit, arc) {
  R(0, 0, T, T, mur, 140)
  R(0, 238, T, 18, sombre(mur, 0.66), 150)
  const trim = '#f3ecdd'
  if (arc) {
    Pth(`M56 256 L56 110 A72 72 0 0 1 200 110 L200 256 L56 256`, trim, 188)
    Pth(`M66 256 L66 112 A62 62 0 0 1 190 112 L190 256 L66 256`, '#1a1512', 60, lit ? '#ffc98a' : null)
    persiennes(68, 112, 59, 142, volet, lit ? FEUTRE : null)
    persiennes(129, 112, 59, 142, volet, lit ? FEUTRE : null)
    return
  }
  R(58, 26, 140, 230, trim, 186)
  R(50, 18, 156, 11, sombre('#f3ecdd', 0.94), 210)
  R(58, 29, 140, 5, 'rgb(60,50,40)', 150)
  R(68, 40, 120, 216, '#1a1512', 60, lit ? '#ffb871' : null)
  R(70, 42, 116, 26, sombre(volet, 0.7), 110)
  for (let k = 0; k < 5; k++) R(74 + k * 22, 44, 3, 22, sombre('#f3ecdd', 0.9), 150)
  persiennes(70, 72, 57, 182, volet, lit ? FEUTRE : null)
  persiennes(129, 72, 57, 182, volet, lit ? FEUTRE : null)
  R(70, 148, 57, 7, sombre(volet, 0.9), 150)
  R(129, 148, 57, 7, sombre(volet, 0.9), 150)
  R(120, 150, 5, 12, '#c9a85e', 200)
  R(131, 150, 5, 12, '#c9a85e', 200)
}
function fenetre(mur, volet, lit, haut) {
  R(0, 0, T, T, mur, 140)
  if (!haut) R(0, 238, T, 18, sombre(mur, 0.66), 150)
  const y0 = haut ? 40 : 62
  const h = haut ? 170 : 128
  R(64, y0 - 10, 128, h + 20, '#f3ecdd', 186)
  R(56, y0 - 18, 144, 10, sombre('#f3ecdd', 0.94), 210)
  R(56, y0 + h + 8, 144, 9, sombre('#f3ecdd', 0.86), 212)
  R(72, y0, 112, h, '#1a1512', 60, lit ? '#ffb871' : null)
  persiennes(74, y0 + 2, 53, h - 4, volet, lit ? FEUTRE : null)
  persiennes(129, y0 + 2, 53, h - 4, volet, lit ? FEUTRE : null)
  // coulures sous l’appui
  R(66, y0 + h + 17, 124, 22, 'rgba(70,60,48,.16)', null)
}
function balcon(mur, volet, lit, ouvert) {
  R(0, 0, T, T, mur, 140)
  R(60, 14, 136, 242, '#f3ecdd', 186)
  R(52, 6, 152, 11, sombre('#f3ecdd', 0.94), 210)
  R(70, 26, 116, 230, '#191410', 60, lit ? '#ffc98a' : null)
  persiennes(72, 28, 55, 226, volet, lit ? FEUTRE : null)
  if (ouvert) {
    R(129, 28, 55, 226, lit ? '#ffcf96' : '#120f0c', 50, lit ? '#ffcf96' : null)
    persiennes(184, 28, 14, 226, volet, null)
  } else persiennes(129, 28, 55, 226, volet, lit ? FEUTRE : null)
}
const ENSEIGNES = ['BOUTIK', 'PHAMASI', 'KAFE', 'MACHANN', 'BOBINO', 'SALON', 'ALIMANTASYON', 'BÈL ART']
function boutique(mur, volet, lit, mot) {
  R(0, 0, T, T, mur, 140)
  R(14, 58, 228, 198, '#f3ecdd', 176)
  R(24, 66, 208, 190, '#17120f', 56, lit ? '#ffc070' : null)
  for (let k = 0; k < 4; k++) {
    R(30, 92 + k * 34, 196, 5, '#6b5233', 100)
    for (let j = 0; j < 12; j++) R(33 + j * 16, 74 + k * 34, 10, 18, ['#c8483a', '#e0b84a', '#3f8a6a', '#3a70a8', '#e6e0d0'][(j * 7 + k * 3) % 5], 112)
  }
  R(10, 12, 236, 40, volet, 170)
  A += `<text x="${X0 + 128}" y="${Y0 + 42}" font-family="Rockwell, Georgia, serif" font-weight="700" font-size="${mot.length > 8 ? 22 : 29}" text-anchor="middle" fill="#f6efdc">${mot}</text>`
  R(0, 238, T, 18, sombre(mur, 0.66), 150)
}
function mur(c, n) {
  R(0, 0, T, T, c, 140)
  R(0, 238, T, 18, sombre(c, 0.66), 150)
  if (n % 3 === 0) R(40 + n * 11, 0, 7, 256, sombre(c, 0.82), 165)
}
for (let col = 0; col < 8; col++) {
  const m = MURS[col]
  const lit = c => hache(col, c) > 0.42
  X0 = col * T
  Y0 = 0
  porte(m, VOLETS[col], lit(1), false)
  Y0 = T
  fenetre(m, VOLETS[(col + 3) % 8], lit(2), false)
  Y0 = 2 * T
  balcon(m, VOLETS[(col + 2) % 8], lit(3), col % 3 === 1)
  Y0 = 3 * T
  fenetre(m, VOLETS[(col + 5) % 8], lit(4), true)
  Y0 = 4 * T
  mur(m, col)
  Y0 = 5 * T
  boutique(m, VOLETS[(col + 1) % 8], lit(5), ENSEIGNES[col])
  Y0 = 6 * T
  porte(m, VOLETS[(col + 6) % 8], lit(6), true)
}
{
  // la dernière rangée : matières particulières
  Y0 = 7 * T
  // 0 : ferronnerie du marché
  X0 = 0
  R(0, 0, T, T, '#1b1a17', 50, '#ffbb70')
  const fer = '#2f7a72'
  R(0, 0, 18, T, fer, 200)
  R(T - 18, 0, 18, T, fer, 200)
  R(0, 0, T, 14, fer, 200)
  Pth(`M18 256 L18 120 A110 110 0 0 1 238 120 L238 256 L226 256 L226 122 A98 98 0 0 0 30 122 L30 256 L18 256`, fer, 200)
  for (let k = 0; k < 7; k++) R(36 + k * 32, 16, 5, 96, fer, 180)
  // 1 : arcade de la Douane
  X0 = T
  R(0, 0, T, T, '#efe7d4', 150)
  Pth(`M34 256 L34 116 A94 94 0 0 1 222 116 L222 256 L34 256`, '#16120f', 50, '#ffc27a')
  Pth(`M22 256 L22 116 A106 106 0 0 1 234 116 L234 256 L222 256 L222 116 A94 94 0 0 0 34 116 L34 256 L22 256`, '#f8f2e4', 195)
  R(0, 0, T, 12, '#f8f2e4', 205)
  // 2 : parpaings bruts
  X0 = 2 * T
  R(0, 0, T, T, '#9c978c', 140)
  for (let l = 0; l < 13; l++) for (let k = -1; k < 6; k++) R(k * 56 + (l % 2) * 28 + 1, l * 20 + 1, 53, 17, ['#a8a297', '#928d82', '#b1aca0'][(k * k + l * 5 + 9) % 3], 150)
  // 3 et 4 : tôles murales
  for (const [q, c] of [
    [3, '#9c5a3c'],
    [4, '#4a7c93'],
  ]) {
    X0 = q * T
    R(0, 0, T, T, c, 140)
    for (let k = 0; k < 16; k++) {
      R(k * 16, 0, 8, T, sombre(c, 1.14), 170)
      R(k * 16 + 8, 0, 8, T, sombre(c, 0.8), 110)
    }
  }
  // 5 : mur peint à la main
  X0 = 5 * T
  R(0, 0, T, T, '#f0e6cd', 140)
  R(0, 28, T, 90, '#1f4f9a', 145)
  R(0, 118, T, 90, '#c8263a', 145)
  A += `<text x="${X0 + 128}" y="${Y0 + 150}" font-family="Rockwell, Georgia, serif" font-weight="700" font-size="50" text-anchor="middle" fill="#fbf3dd">JAKMÈL</text>`
  R(0, 238, T, 18, '#8c8370', 150)
  // 6 : la porte de la galerie
  X0 = 6 * T
  porte('#f3ecdd', '#2e8c86', true, false)
  R(112, 6, 32, 10, '#d21034', 215, '#d21034')
  // 7 : l’étage de la galerie
  X0 = 7 * T
  balcon('#f3ecdd', '#2e8c86', true, false)
}
const svgAtlas = c => `<svg xmlns="http://www.w3.org/2000/svg" width="${8 * T}" height="${8 * T}"><rect width="100%" height="100%" fill="#000"/>${c}</svg>`
{
  const W = 8 * T
  const brut = await sharp(Buffer.from(svgAtlas(A))).removeAlpha().raw().toBuffer()
  const hBrut = await sharp(Buffer.from(svgAtlas(Hh))).greyscale().blur(0.7).raw().toBuffer()
  const n1 = bruit(301)
  const n2 = bruit(307)
  const h = new Float32Array(W * W)
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const tx = x % T
      const ty = y % T
      // enduit taché, coulures qui descendent, patine
      const tache = fbm(n1, x * 0.016, y * 0.016, 3)
      const coulure = fbm(n2, x * 0.09, y * 0.006, 3)
      const grain = n1(x * 0.42, y * 0.42)
      const haut = smooth(70, 0, ty) * 0.05
      const k = 1 + tache * 0.1 + grain * 0.05 - Math.max(0, coulure - 0.16) * 0.22 - haut - smooth(200, 256, ty) * 0.07 * (tx >= 0 ? 1 : 0)
      for (let c = 0; c < 3; c++) brut[i * 3 + c] = clamp(brut[i * 3 + c] * k, 0, 255)
      h[i] = hBrut[i] / 255 + grain * 0.012
    }
  }
  await sharp(brut, { raw: { width: W, height: W, channels: 3 } }).webp({ quality: 80, effort: 5 }).toFile(join(OUT, 'facades.webp'))
  await versNormale(h, W, W, 3.2, 'facades-normale.webp', 74)
  await sharp(Buffer.from(svgAtlas(Em))).removeAlpha().blur(1.2).resize(1024).webp({ quality: 62, effort: 5 }).toFile(join(OUT, 'facades-nuit.webp'))
}

// ---------- tôle ondulée ----------
function bruitP(seed) {
  const r_ = hasard(seed)
  const perm = Uint16Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r_() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  const gx = new Float32Array(256)
  const gy = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const a = r_() * TAU
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
      const k = perm[(perm[((i % px) + px) % px & 255] + (((j % py) + py) % py)) & 255]
      return gx[k] * dx + gy[k] * dy
    }
    const u = fade(fx)
    const v = fade(fy)
    return lerp(lerp(dot(X, Y, fx, fy), dot(X + 1, Y, fx - 1, fy), u), lerp(dot(X, Y + 1, fx, fy - 1), dot(X + 1, Y + 1, fx - 1, fy - 1), u), v) * 1.5
  }
}
const fbmP = (n, u, v, fx, fy, oct) => {
  let s = 0
  let a = 1
  let t = 0
  for (let o = 0; o < oct; o++) {
    s += a * n(u * fx, v * fy, fx, fy)
    t += a
    a *= 0.5
    fx *= 2
    fy *= 2
  }
  return s / t
}
{
  const W = 1024
  const n1 = bruitP(401)
  const n2 = bruitP(409)
  const n3 = bruitP(419)
  const alb = Buffer.alloc(W * W * 3)
  const h = new Float32Array(W * W)
  const ONDES = 48
  const RANGS = 5
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const u = x / W
      const v = y / W
      const rang = Math.floor(v * RANGS)
      const dansRang = v * RANGS - rang
      const decal = hache(rang, 1) * 0.08
      const onde = Math.sin(((u + decal) % 1) * ONDES * TAU)
      const taches = fbmP(n1, u, v, 3, 3, 4)
      const coulures = fbmP(n2, u, v, 26, 4, 3)
      const rouille = smooth(0.16, 0.62, taches * 0.9 + coulures * 0.24 + smooth(0.8, 1, dansRang) * 0.2)
      const fin = fbmP(n3, u, v, 90, 90, 2)
      let c = mix([232, 232, 226], [208, 146, 100], rouille * 0.72)
      c = mix(c, [136, 88, 62], smooth(0.5, 0.86, rouille * 0.7 + taches * 0.45 + fin * 0.12) * 0.42)
      const relief_ = 0.9 + onde * 0.1
      const joint = dansRang > 0.975 ? 0.62 : 1
      const clou = dansRang < 0.03 && Math.abs(onde - 1) < 0.08 ? 0.66 : 1
      alb[i * 3] = clamp(c[0] * relief_ * joint * clou * (1 + fin * 0.05), 0, 255)
      alb[i * 3 + 1] = clamp(c[1] * relief_ * joint * clou * (1 + fin * 0.05), 0, 255)
      alb[i * 3 + 2] = clamp(c[2] * relief_ * joint * clou * (1 + fin * 0.05), 0, 255)
      h[i] = onde * 0.5 + (dansRang > 0.975 ? -0.5 : 0)
    }
  }
  await sharp(alb, { raw: { width: W, height: W, channels: 3 } }).webp({ quality: 76, effort: 5 }).toFile(join(OUT, 'tole.webp'))
  await versNormale(h, W, W, 1.05, 'tole-normale.webp', 72)
}

// ---------- béton des toits-terrasses ----------
{
  const W = 512
  const n1 = bruitP(431)
  const n2 = bruitP(439)
  const b_ = Buffer.alloc(W * W)
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const u = x / W
      const v = y / W
      const t = fbmP(n1, u, v, 4, 4, 4)
      const g = fbmP(n2, u, v, 60, 60, 2)
      b_[y * W + x] = clamp(226 + t * 44 + g * 16 - smooth(0.2, 0.5, t) * 62, 0, 255)
    }
  await sharp(b_, { raw: { width: W, height: W, channels: 1 } }).webp({ quality: 72 }).toFile(join(OUT, 'beton.webp'))
}

// ---------- feuillage : grappes de feuilles sur fond transparent ----------
{
  const rf = hasard(733)
  let f = ''
  for (let i = 0; i < 240; i++) {
    const d = Math.sqrt(rf()) * 232
    const a = rf() * TAU
    const x = 256 + Math.cos(a) * d
    const y = 256 + Math.sin(a) * d
    const l = 20 + rf() * 22
    const g = Math.round(150 + rf() * 105)
    f += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${l.toFixed(1)}" ry="${(l * 0.42).toFixed(1)}" transform="rotate(${(rf() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="rgb(${g},${g},${g})"/>`
  }
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${f}</svg>`)).webp({ quality: 74, alphaQuality: 85, effort: 5 }).toFile(join(OUT, 'feuilles.webp'))
  // palme : rachis et folioles
  let p_ = ''
  for (let i = 0; i < 46; i++) {
    const t = i / 46
    const x = 14 + t * 484
    const L = 56 * Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.05))
    for (const s of [-1, 1]) p_ += `<path d="M${x.toFixed(1)} 64L${(x + 18 + t * 12).toFixed(1)} ${(64 + s * L).toFixed(1)}L${(x + 26 + t * 12).toFixed(1)} ${(64 + s * L * 0.92).toFixed(1)}L${(x + 7).toFixed(1)} 64Z" fill="#fff"/>`
  }
  p_ += `<rect x="6" y="62" width="500" height="4" fill="#d8d0b4"/>`
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128">${p_}</svg>`)).webp({ quality: 76, alphaQuality: 88, effort: 5 }).toFile(join(OUT, 'palme.webp'))
}

// ---------- ferronnerie : garde-corps (haut) et dentelle de bois (bas), avec transparence ----------
{
  let f = ''
  for (let k = 0; k < 4; k++) {
    const x = k * 64
    f += `<rect x="${x}" y="6" width="64" height="7" fill="#fff"/><rect x="${x}" y="114" width="64" height="8" fill="#fff"/><rect x="${x}" y="6" width="5" height="116" fill="#fff"/>`
    f += `<g fill="none" stroke="#fff" stroke-width="4"><path d="M${x + 32} 14V114"/><path d="M${x + 32} 40C${x + 12} 40 ${x + 12} 70 ${x + 32} 70C${x + 52} 70 ${x + 52} 40 ${x + 32} 40"/><path d="M${x + 32} 76C${x + 16} 80 ${x + 16} 104 ${x + 32} 110C${x + 48} 104 ${x + 48} 80 ${x + 32} 76"/></g>`
  }
  for (let k = 0; k < 8; k++) {
    const x = k * 32
    f += `<path fill="#fff" d="M${x} 128H${x + 32}V146C${x + 32} 168 ${x + 24} 176 ${x + 16} 188C${x + 8} 176 ${x} 168 ${x} 146Z"/>`
    f += `<circle cx="${x + 16}" cy="150" r="7" fill="#000"/>`
  }
  const masque = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="#000"/>${f}</svg>`)).greyscale().raw().toBuffer()
  const rgba = Buffer.alloc(256 * 256 * 4, 255)
  for (let i = 0; i < 256 * 256; i++) rgba[i * 4 + 3] = masque[i]
  await sharp(rgba, { raw: { width: 256, height: 256, channels: 4 } }).webp({ quality: 80, alphaQuality: 90 }).toFile(join(OUT, 'fer.webp'))
}
console.log('matières cuites')
