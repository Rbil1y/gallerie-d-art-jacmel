// La maquette 3D du centre-ville de Jacmel, construite en direct d’après les données cuites
// (scripts/maquette/construire.mjs) : chaque maison à sa vraie place, avec sa vraie forme.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type P2 = [number, number]
type Maison = { p: P2[]; c: P2; s: number; e: number; r: number; n: number; t: number; f: number[]; id: number; g?: number }
type Donnees = {
  B: number
  SMAX: number
  GR: number
  relief: number[]
  maisons: Maison[]
  arbres: [number, number, number, number][]
  palmiers: [number, number, number, number][]
  canots: [number, number, number, number, number][]
  vehicules: [number, number, number, number][]
  wharf: P2[][]
  clotures: { p: P2[]; h: number; c: number }[]
  gens: [number, number, number][]
  poteaux: P2[][]
  angle: number
  galerie: P2
}
type V = [number, number, number]
type C = [number, number, number]

const hache = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const lin = (h: string): C => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
const BLANC: C = [1, 1, 1]
const fois = (c: C, k: number): C => [c[0] * k, c[1] * k, c[2] * k]

/** Un lot de triangles partageant un matériau. */
class Lot {
  p: number[] = []
  n: number[] = []
  uv: number[] = []
  c: number[] = []
  tri(a: V, b: V, c: V, ua: P2, ub: P2, uc: P2, ca: C, cb: C, cc: C, n?: V) {
    const g = cross(sub(b, a), sub(c, a))
    const nn = n ?? norm(g)
    if (n && dot(g, n) < 0) {
      ;[b, c] = [c, b]
      ;[ub, uc] = [uc, ub]
      ;[cb, cc] = [cc, cb]
    }
    for (const [q, u, k] of [
      [a, ua, ca],
      [b, ub, cb],
      [c, uc, cc],
    ] as [V, P2, C][]) {
      this.p.push(q[0], q[1], q[2])
      this.n.push(nn[0], nn[1], nn[2])
      this.uv.push(u[0], u[1])
      this.c.push(k[0], k[1], k[2])
    }
  }
  /** a et b en bas, c et d en haut ; uv = [u0, v0, u1, v1]. */
  quad(a: V, b: V, c: V, d: V, n: V, uv: [number, number, number, number], col: C, colHaut: C = col) {
    const [u0, v0, u1, v1] = uv
    this.tri(a, b, c, [u0, v0], [u1, v0], [u1, v1], col, col, colHaut, n)
    this.tri(a, c, d, [u0, v0], [u1, v1], [u0, v1], col, colHaut, colHaut, n)
  }
  /** Parallélépipède tourné autour de y. */
  boite(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, ang: number, col: C, colBas: C = col) {
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    const P = (a: number, b: number, y: number): V => [cx + a * c - b * s, y, cz + a * s + b * c]
    const a = sx / 2
    const b = sz / 2
    const y0 = cy - sy / 2
    const y1 = cy + sy / 2
    const uv: [number, number, number, number] = [0, 0, 1, 1]
    const N = (x: number, z: number): V => [x * c - z * s, 0, x * s + z * c]
    this.quad(P(-a, -b, y0), P(a, -b, y0), P(a, -b, y1), P(-a, -b, y1), N(0, -1), uv, colBas, col)
    this.quad(P(a, b, y0), P(-a, b, y0), P(-a, b, y1), P(a, b, y1), N(0, 1), uv, colBas, col)
    this.quad(P(a, -b, y0), P(a, b, y0), P(a, b, y1), P(a, -b, y1), N(1, 0), uv, colBas, col)
    this.quad(P(-a, b, y0), P(-a, -b, y0), P(-a, -b, y1), P(-a, b, y1), N(-1, 0), uv, colBas, col)
    this.quad(P(-a, -b, y1), P(a, -b, y1), P(a, b, y1), P(-a, b, y1), [0, 1, 0], uv, col)
  }
  geometrie() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3))
    return g
  }
}

const tuile = (col: number, rang: number): [number, number, number, number] => {
  const e = 0.012
  return [(col + e) / 8, 1 - (rang + 1 - e) / 8, (col + 1 - e) / 8, 1 - (rang + e) / 8]
}

/** Plus petit rectangle orienté contenant le polygone. */
function rectangle(p: P2[]) {
  let best = { aire: Infinity, cx: 0, cz: 0, ux: 1, uz: 0, hl: 1, hw: 1 }
  for (let i = 0; i < p.length; i++) {
    const a = p[i]
    const b = p[(i + 1) % p.length]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.5) continue
    const ux = (b[0] - a[0]) / l
    const uz = (b[1] - a[1]) / l
    let a0 = Infinity
    let a1 = -Infinity
    let b0 = Infinity
    let b1 = -Infinity
    for (const q of p) {
      const s = q[0] * ux + q[1] * uz
      const t = -q[0] * uz + q[1] * ux
      a0 = Math.min(a0, s)
      a1 = Math.max(a1, s)
      b0 = Math.min(b0, t)
      b1 = Math.max(b1, t)
    }
    const aire = (a1 - a0) * (b1 - b0)
    if (aire < best.aire) {
      const ma = (a0 + a1) / 2
      const mb = (b0 + b1) / 2
      best = { aire, cx: ma * ux - mb * uz, cz: ma * uz + mb * ux, ux, uz, hl: (a1 - a0) / 2, hw: (b1 - b0) / 2 }
    }
  }
  // le grand axe d’abord
  if (best.hw > best.hl) {
    const { ux, uz, hl, hw } = best
    best.ux = -uz
    best.uz = ux
    best.hl = hw
    best.hw = hl
  }
  return best
}

const TEINTES_TOLE = ['#b4654a', '#d2d3ce', '#bb6a4d', '#c9cac4', '#a9503c', '#6fa39a', '#d9d9d4', '#94a37e']
const TEINTES_BOIS = ['#f4eee0', '#2e8c86', '#f4eee0', '#e9c98e', '#f4eee0', '#3f7a4a']
const HAUT_ETAGE = 3.75
const BAIE = 3.2

export type Maquette = {
  regler: (r: { souris?: [number, number]; pas?: number }) => void
  soleil: (elevation: number, azimut: number, chaud: number, nuit: boolean) => void
  dimensionner: () => void
  pointGalerie: () => { x: number; y: number }
  rendre: () => void
  detruire: () => void
}

export type OptionsMaquette = {
  /** taille à l’écran du socle, rapportée à la hauteur du canevas */
  echelle: () => number
  dprMax?: number
  /** mesure l’appareil et renonce s’il est trop lent */
  exigeant?: boolean
  /** appelé après chaque image, pour suivre le point rouge */
  apresImage?: () => void
}

export async function creerMaquette(canvas: HTMLCanvasElement, options: OptionsMaquette): Promise<Maquette> {
  const base = `${import.meta.env.BASE_URL}maquette/`
  const D: Donnees = await (await fetch(`${base}donnees.json`)).json()
  const { B, GR, relief } = D

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NoToneMapping // appliqué à la dernière passe, après la profondeur de champ
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.VSMShadowMap
  renderer.shadowMap.autoUpdate = false
  const anis = Math.min(4, renderer.capabilities.getMaxAnisotropy())
  /** Rend la main au navigateur : la construction ne doit jamais figer la page. */
  const souffle = () => new Promise<void>(r => setTimeout(r, 0))

  // décodage hors du fil principal
  const chargeur = new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })
  const tex = async (nom: string, srgb = false, rep = false) => {
    const bitmap = await chargeur.loadAsync(`${base}${nom}.webp`)
    const t = new THREE.Texture(bitmap as unknown as HTMLImageElement)
    t.flipY = false
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    t.anisotropy = anis
    t.generateMipmaps = true
    t.minFilter = THREE.LinearMipmapLinearFilter
    if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.needsUpdate = true
    return t
  }
  const [solC, solN, solR, solE, facC, facN, facE, toleC, toleN, cotes, fer, beton, feuilles, palme] = await Promise.all([
    tex('sol', true),
    tex('sol-normale'),
    tex('sol-rugosite'),
    tex('sol-lumiere', true),
    tex('facades', true),
    tex('facades-normale'),
    tex('facades-nuit', true),
    tex('tole', true, true),
    tex('tole-normale', false, true),
    tex('cotes', true),
    tex('fer', false, true),
    tex('beton', true, true),
    tex('feuilles', true),
    tex('palme', true),
  ])

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.5

  // ---------- matériaux ----------
  const matFacade = new THREE.MeshLambertMaterial({ map: facC, normalMap: facN, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, emissive: 0xffffff, emissiveMap: facE, emissiveIntensity: 0 })
  const matTole = new THREE.MeshLambertMaterial({ map: toleC, normalMap: toleN, normalScale: new THREE.Vector2(0.9, 0.9), vertexColors: true, side: THREE.DoubleSide })
  const matPlein = new THREE.MeshLambertMaterial({ vertexColors: true })
  const matBeton = new THREE.MeshLambertMaterial({ map: beton, vertexColors: true })
  const matFer = new THREE.MeshLambertMaterial({ alphaMap: fer, alphaTest: 0.5, vertexColors: true, side: THREE.DoubleSide })
  const matSol = new THREE.MeshStandardMaterial({ map: solC, normalMap: solN, normalScale: new THREE.Vector2(1, 1), roughnessMap: solR, roughness: 1, emissive: 0xffffff, emissiveMap: solE, emissiveIntensity: 0 })
  const matCotes = new THREE.MeshLambertMaterial({ map: cotes })
  const matSocle = new THREE.MeshLambertMaterial({ color: '#2a201a' })

  const facades = new Lot()
  const toles = new Lot()
  const pleins = new Lot()
  const fers = new Lot()
  const betons = new Lot()

  const hauteur = (x: number, z: number) => {
    const fx = Math.min(GR - 1e-3, Math.max(0, (x / B + 0.5) * GR))
    const fz = Math.min(GR - 1e-3, Math.max(0, (z / B + 0.5) * GR))
    const i = Math.floor(fx)
    const j = Math.floor(fz)
    const u = fx - i
    const v = fz - j
    const L = GR + 1
    const a = relief[j * L + i]
    const b = relief[j * L + i + 1]
    const c = relief[(j + 1) * L + i]
    const d = relief[(j + 1) * L + i + 1]
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
  }

  // ---------- les maisons ----------
  let tranche = 0
  for (const m of D.maisons) {
    if (m.t === 1) continue
    if (++tranche % 24 === 0) await souffle()
    const y0 = hauteur(m.c[0], m.c[1]) + 0.02
    const n = m.p.length
    const couleur = Math.floor(m.r * 8) % 8
    const r2 = hache(m.id % 7919, 3)
    const baraque = m.s < 30 && m.r < 0.5 && !m.n
    const parpaing = !m.n && !baraque && r2 < 0.22 && m.t === 0
    const institution = m.t === 3 || m.t === 2
    const H = HAUT_ETAGE * (m.t === 2 ? 1.25 : 1)
    const hMurs = H * m.e
    const R = rectangle(m.p)
    const rectangulaire = m.s / (4 * R.hl * R.hw) > 0.8 && R.hl < 44
    const pente = rectangulaire && (m.n || m.t > 1 || r2 > 0.3)
    const hPar = pente ? 0 : 0.55

    for (let i = 0; i < n; i++) {
      const A = m.p[i]
      const Bq = m.p[(i + 1) % n]
      const L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1])
      if (L < 0.3) continue
      const nx = (Bq[1] - A[1]) / L
      const nz = -(Bq[0] - A[0]) / L
      const normale: V = [nx, 0, nz]
      const nb = Math.max(1, Math.round(L / BAIE))
      const rue = m.f[i] === 1
      for (let k = 0; k < m.e; k++) {
        const yb = y0 + k * H - (k === 0 ? 0.6 : 0)
        const yt = y0 + (k + 1) * H
        for (let j = 0; j < nb; j++) {
          const t0 = j / nb
          const t1 = (j + 1) / nb
          const a: P2 = [A[0] + (Bq[0] - A[0]) * t1, A[1] + (Bq[1] - A[1]) * t1]
          const b: P2 = [A[0] + (Bq[0] - A[0]) * t0, A[1] + (Bq[1] - A[1]) * t0]
          const h1 = hache(m.id % 3571, j * 7 + k * 13 + i)
          let t: [number, number, number, number]
          if (m.g) {
            t = k === 0 ? (j === Math.floor(nb / 2) && rue ? tuile(6, 7) : tuile(7, rue ? 1 : 4)) : rue ? tuile(7, 7) : tuile(7, 3)
          } else if (m.t === 2) {
            t = k === 0 ? tuile(1, 7) : tuile(7, 3)
          } else if (baraque) {
            t = tuile(m.r < 0.25 ? 3 : 4, 7)
          } else if (parpaing) {
            t = rue && j % 2 === 0 ? tuile(couleur, 0) : tuile(2, 7)
          } else if (institution) {
            t = k === 0 ? tuile(7, j % 2 ? 1 : 0) : tuile(7, 3)
          } else if (rue) {
            if (k === 0) t = m.n ? (h1 < 0.3 ? tuile(couleur, 5) : h1 < 0.7 ? tuile(couleur, h1 < 0.48 ? 6 : 0) : tuile(couleur, 1)) : j % 2 ? tuile(couleur, 1) : tuile(couleur, 0)
            else t = m.n ? tuile(couleur, 2) : tuile(couleur, 3)
          } else {
            t = L > 9 && !m.n && h1 < 0.05 ? tuile(5, 7) : h1 < 0.3 ? tuile(couleur, k === 0 ? 1 : 3) : tuile(couleur, 4)
          }
          const claire = 0.92 + hache(m.id % 811, 2) * 0.12
          const bas = fois(BLANC, (k === 0 ? 0.74 : 0.92) * claire)
          const haut = fois(BLANC, claire * (k === m.e - 1 ? 0.9 : 1))
          facades.quad([a[0], yb, a[1]], [b[0], yb, b[1]], [b[0], yt, b[1]], [a[0], yt, a[1]], normale, t, bas, haut)
        }
      }
      if (hPar) {
        // acrotère du toit-terrasse
        const y1 = y0 + hMurs
        const col = fois(lin('#c9c2b4'), 0.95)
        pleins.quad([A[0], y1, A[1]], [Bq[0], y1, Bq[1]], [Bq[0], y1 + hPar, Bq[1]], [A[0], y1 + hPar, A[1]], normale, [0, 0, 1, 1], col)
      }
      // galeries à balcon : la signature de Jacmel
      if (rue && m.n && L >= 5 && m.t === 0 && !baraque && (m.e >= 2 || r2 > 0.55)) {
        const d = 1.5
        const ang = Math.atan2(Bq[1] - A[1], Bq[0] - A[0])
        const mx = (A[0] + Bq[0]) / 2
        const mz = (A[1] + Bq[1]) / 2
        const bois = lin(TEINTES_BOIS[Math.floor(r2 * TEINTES_BOIS.length) % TEINTES_BOIS.length])
        const hT = y0 + hMurs
        const Q = (t: number, off: number, y: number): V => [A[0] + (Bq[0] - A[0]) * t + nx * off, y, A[1] + (Bq[1] - A[1]) * t + nz * off]
        if (m.e >= 2) {
          pleins.boite(mx + nx * d * 0.5, y0 + H, mz + nz * d * 0.5, L, 0.2, d, ang, fois(bois, 0.92))
          const tint = lin(m.r < 0.5 ? '#26262a' : '#f0ead8')
          fers.quad(Q(0, d, y0 + H + 0.1), Q(1, d, y0 + H + 0.1), Q(1, d, y0 + H + 1.25), Q(0, d, y0 + H + 1.25), [nx, 0, nz], [0, 0.5, L / 3, 1], tint)
        }
        for (let j = 0; j <= nb; j++) {
          const q = Q(j / nb, d - 0.1, 0)
          pleins.boite(q[0], y0 + hMurs / 2, q[2], 0.2, hMurs, 0.2, ang, bois, fois(bois, 0.72))
        }
        // auvent de tôle, dentelle de bois
        const tole = fois(lin(TEINTES_TOLE[Math.floor(m.r * 8) % 8]), 1)
        toles.quad(Q(0, d + 0.3, hT - 0.05), Q(1, d + 0.3, hT - 0.05), Q(1, -0.05, hT + 0.55), Q(0, -0.05, hT + 0.55), norm([nx * 0.3, 1, nz * 0.3]), [0, 0, L / 3.2, (d + 0.3) / 3.2], tole)
        fers.quad(Q(0, d + 0.02, hT - 0.72), Q(1, d + 0.02, hT - 0.72), Q(1, d + 0.02, hT - 0.06), Q(0, d + 0.02, hT - 0.06), [nx, 0, nz], [0, 0.27, L / 1.6, 0.5], lin('#f7f2e6'))
      }
    }

    // ---------- toits ----------
    const yT = y0 + hMurs
    if (pente) {
      const o = 0.5
      const { cx, cz, ux, uz, hl, hw } = R
      const vx = -uz
      const vz = ux
      const P = (a: number, b: number, y: number): V => [cx + ux * a + vx * b, y, cz + uz * a + vz * b]
      const rise = Math.min(hw * 0.6, m.t === 2 ? 6.5 : 3.4)
      const A = hl + o
      const W = hw + o
      const yE = yT - 0.08
      const yR = yT + rise
      const hip = r2 > 0.42 || m.t > 1
      const Rl = hip ? Math.max(0.2, hl - hw * 0.85) : A
      const tole = lin(m.g ? '#c9cac4' : TEINTES_TOLE[Math.floor(hache(m.id % 2003) * 8) % 8])
      const sl = Math.hypot(W, rise) / 6.4
      const du = hache(m.id % 991, 1)
      const dv = hache(m.id % 991, 2)
      const haut: V = [0, 1, 0]
      const nFace = (a: V, b: V, c: V) => {
        const q = norm(cross(sub(b, a), sub(c, a)))
        return dot(q, haut) < 0 ? ([-q[0], -q[1], -q[2]] as V) : q
      }
      const q1: [V, V, V, V] = [P(-A, -W, yE), P(A, -W, yE), P(Rl, 0, yR), P(-Rl, 0, yR)]
      const q2: [V, V, V, V] = [P(A, W, yE), P(-A, W, yE), P(-Rl, 0, yR), P(Rl, 0, yR)]
      for (const q of [q1, q2]) toles.quad(q[0], q[1], q[2], q[3], nFace(q[0], q[1], q[2]), [du, dv, du + (2 * A) / 6.4, dv + sl], tole)
      if (hip) {
        for (const s of [1, -1]) {
          const a = P(s * A, -W, yE)
          const b = P(s * A, W, yE)
          const c = P(s * Rl, 0, yR)
          toles.tri(a, b, c, [du, dv], [du + (2 * W) / 6.4, dv], [du + W / 6.4, dv + sl], tole, tole, tole, nFace(a, b, c))
        }
      } else {
        const mur = lin(['#e9dcc0', '#dcb67c', '#dc9c7e', '#a9d0ba', '#82bfb8', '#a8c6da', '#e8d384', '#f0eadd'][couleur])
        for (const s of [1, -1]) {
          const a = P(s * hl, -hw, yT)
          const b = P(s * hl, hw, yT)
          const c = P(s * hl, 0, yR - 0.1)
          pleins.tri(a, b, c, [0, 0], [1, 0], [0.5, 1], mur, mur, mur, norm([ux * s, 0, uz * s]))
        }
      }
      // faîtage
      {
        const a = P(-Rl, 0, yR + 0.07)
        const b = P(Rl, 0, yR + 0.07)
        const lg = Math.hypot(b[0] - a[0], b[2] - a[2])
        if (lg > 0.5) pleins.boite((a[0] + b[0]) / 2, yR + 0.06, (a[2] + b[2]) / 2, lg, 0.14, 0.42, Math.atan2(uz, ux), fois(tole, 0.82))
      }
      // rives et sous-face
      const rive = lin(TEINTES_BOIS[Math.floor(r2 * 6) % 6])
      const ep = 0.2
      const S: [number, number, number, number][] = [
        [-A, -W, A, -W],
        [A, W, -A, W],
      ]
      if (hip) S.push([A, -W, A, W], [-A, W, -A, -W])
      for (const [a0, b0, a1, b1] of S) {
        const n0 = norm(sub(P(a0 + a1, b0 + b1, 0), P(0, 0, 0)))
        pleins.quad(P(a0, b0, yE - ep), P(a1, b1, yE - ep), P(a1, b1, yE), P(a0, b0, yE), n0, [0, 0, 1, 1], rive)
      }
      pleins.quad(P(-A, -W, yE - 0.02), P(A, -W, yE - 0.02), P(A, W, yE - 0.02), P(-A, W, yE - 0.02), [0, -1, 0], [0, 0, 1, 1], fois(rive, 0.5))
    } else {
      const contour = m.p.map(q => new THREE.Vector2(q[0], q[1]))
      const faces = THREE.ShapeUtils.triangulateShape(contour, [])
      const col = fois(lin('#bfb8aa'), 0.86 + hache(m.id % 613) * 0.2)
      for (const [a, b, c] of faces) {
        const A: V = [m.p[a][0], yT + 0.06, m.p[a][1]]
        const Bv: V = [m.p[b][0], yT + 0.06, m.p[b][1]]
        const Cv: V = [m.p[c][0], yT + 0.06, m.p[c][1]]
        const uvm = (q: V): P2 => [q[0] / 11, q[2] / 11]
        betons.tri(A, Bv, Cv, uvm(A), uvm(Bv), uvm(Cv), col, col, col, [0, 1, 0])
      }
      // réservoir noir et fers en attente : le toit-terrasse haïtien
      if (m.s > 45 && r2 < 0.55) {
        const tx = m.c[0] + (r2 - 0.25) * R.hl * 0.9
        const tz = m.c[1] + (m.r - 0.5) * R.hw * 0.9
        pleins.boite(tx, yT + 0.86, tz, 1.5, 1.6, 1.5, r2 * 3, lin('#1f2226'))
      }
      if (m.s > 40) for (const q of m.p.slice(0, 6)) pleins.boite(q[0] * 0.97 + m.c[0] * 0.03, yT + 0.9, q[1] * 0.97 + m.c[1] * 0.03, 0.09, 1.6, 0.09, 0, lin('#4a4038'))
    }
  }

  await souffle()
  // ---------- le Marché en fer ----------
  for (const m of D.maisons.filter(q => q.t === 1)) {
    const y0 = hauteur(m.c[0], m.c[1]) + 0.05
    const { cx, cz, ux, uz, hl, hw } = rectangle(m.p)
    const vx = -uz
    const vz = ux
    const ang = Math.atan2(uz, ux)
    const P = (a: number, b: number, y: number): V => [cx + ux * a + vx * b, y, cz + uz * a + vz * b]
    const H1 = 7.2
    const vert = lin('#2f7a72')
    const toit = lin('#a9503c')
    // dallage et étals
    const dal = P(0, 0, y0)
    pleins.boite(dal[0], y0 + 0.12, dal[2], hl * 2, 0.24, hw * 2, ang, lin('#b9ad98'))
    const nA = Math.max(2, Math.round((hl * 2) / 6))
    const nB = Math.max(2, Math.round((hw * 2) / 6))
    const etal = ['#c8483a', '#e0b84a', '#3f8a6a', '#3a70a8', '#e6e0d0', '#d8743a']
    for (let i = 1; i < nA; i++)
      for (let j = 1; j < nB; j++) {
        const q = P(-hl + (2 * hl * i) / nA, -hw + (2 * hw * j) / nB, 0)
        const h = 1.2 + hache(i, j) * 1.5
        pleins.boite(q[0], y0 + 0.24 + h / 2, q[2], 3.6, h, 2.2, ang, lin(etal[(i * 3 + j * 5) % 6]))
      }
    // arcades de fer tout autour
    const bords: [number, number, number, number, number][] = [
      [-hl, -hw, hl, -hw, nA],
      [hl, hw, -hl, hw, nA],
      [hl, -hw, hl, hw, nB],
      [-hl, hw, -hl, -hw, nB],
    ]
    for (const [a0, b0, a1, b1, n] of bords) {
      const nor = norm(sub(P((a0 + a1) / 2, (b0 + b1) / 2, 0), P(0, 0, 0)))
      for (let k = 0; k < n; k++) {
        const t0 = k / n
        const t1 = (k + 1) / n
        const p0 = P(a0 + (a1 - a0) * t1, b0 + (b1 - b0) * t1, y0)
        const p1 = P(a0 + (a1 - a0) * t0, b0 + (b1 - b0) * t0, y0)
        const hw2: V = [p0[0], y0 + H1, p0[2]]
        const hw3: V = [p1[0], y0 + H1, p1[2]]
        facades.quad(p0, p1, hw3, hw2, nor, tuile(0, 7), BLANC)
        pleins.boite(p1[0], y0 + H1 / 2, p1[2], 0.42, H1, 0.42, ang, vert, fois(vert, 0.75))
      }
    }
    // grande toiture à lanterne
    const o = 1.1
    const A = hl + o
    const W = hw + o
    const yE = y0 + H1
    const yB = yE + 3.2
    const wI = hw * 0.42
    const yL = yB + 2.6
    const yR = yL + 2.8
    const up: V = [0, 1, 0]
    const f = (a: V, b: V, c: V) => {
      const q = norm(cross(sub(b, a), sub(c, a)))
      return dot(q, up) < 0 ? ([-q[0], -q[1], -q[2]] as V) : q
    }
    for (const s of [1, -1]) {
      const a = P(-A, s * W, yE)
      const b = P(A, s * W, yE)
      const c = P(A * 0.96, s * wI, yB)
      const d = P(-A * 0.96, s * wI, yB)
      toles.quad(a, b, c, d, f(a, b, c), [0, 0, (2 * A) / 3.2, Math.hypot(W - wI, yB - yE) / 3.2], toit)
      // lanterne vitrée
      const n: V = norm(sub(P(0, s, 0), P(0, 0, 0)))
      const nL = Math.max(3, Math.round((A * 1.9) / 4))
      for (let k = 0; k < nL; k++) {
        const t0 = (k / nL) * 2 - 1
        const t1 = ((k + 1) / nL) * 2 - 1
        facades.quad(P(A * 0.96 * t1, s * wI, yB), P(A * 0.96 * t0, s * wI, yB), P(A * 0.96 * t0, s * wI, yL), P(A * 0.96 * t1, s * wI, yL), n, tuile(0, 7), BLANC)
      }
      const a2 = P(-A * 0.98, s * (wI + 0.5), yL - 0.1)
      const b2 = P(A * 0.98, s * (wI + 0.5), yL - 0.1)
      const c2 = P(A * 0.98, 0, yR)
      const d2 = P(-A * 0.98, 0, yR)
      toles.quad(a2, b2, c2, d2, f(a2, b2, c2), [0, 0, (2 * A) / 3.2, Math.hypot(wI, yR - yL) / 3.2], toit)
      // pignon de la lanterne
      const e1 = P(s * A * 0.97, -wI, yL)
      const e2 = P(s * A * 0.97, wI, yL)
      const e3 = P(s * A * 0.97, 0, yR - 0.1)
      pleins.tri(e1, e2, e3, [0, 0], [1, 0], [0.5, 1], vert, vert, vert, norm([ux * s, 0, uz * s]))
      // pente d’about
      const g1 = P(s * A, -W, yE)
      const g2 = P(s * A, W, yE)
      const g3 = P(s * A * 0.96, wI, yB)
      const g4 = P(s * A * 0.96, -wI, yB)
      toles.quad(g1, g2, g3, g4, f(g1, g2, g3), [0, 0, (2 * W) / 3.2, 0.9], toit)
    }
  }

  // ---------- le wharf ----------
  for (const w of D.wharf) {
    for (let i = 1; i < w.length; i++) {
      const [ax, az] = w[i - 1]
      const [bx, bz] = w[i]
      const l = Math.hypot(bx - ax, bz - az)
      const inB = (x: number, z: number) => Math.abs(x) < B / 2 - 1 && Math.abs(z) < B / 2 - 1
      const nseg = Math.ceil(l / 4)
      for (let k = 0; k < nseg; k++) {
        const t = (k + 0.5) / nseg
        const x = ax + (bx - ax) * t
        const z = az + (bz - az) * t
        if (!inB(x, z) || hauteur(x, z) > 0.05) continue
        const ang = Math.atan2(bz - az, bx - ax)
        pleins.boite(x, 1.1, z, l / nseg + 0.1, 0.5, 8, ang, lin('#a79f90'))
        for (const s of [-1, 1]) pleins.boite(x - Math.sin(ang) * s * 3.6, 0.3, z + Math.cos(ang) * s * 3.6, 0.5, 1.4, 0.5, 0, lin('#4b4238'))
      }
    }
  }

  // ---------- la galerie : un point de repère discret sur son toit ----------
  const yGal = hauteur(D.galerie[0], D.galerie[1]) + HAUT_ETAGE * 2 + 5

  const groupe = new THREE.Group()
  scene.add(groupe)
  const ajouter = (lot: Lot, mat: THREE.Material) => {
    const me = new THREE.Mesh(lot.geometrie(), mat)
    me.castShadow = true
    me.receiveShadow = true
    groupe.add(me)
    return me
  }
  ajouter(facades, matFacade)
  ajouter(toles, matTole)
  ajouter(pleins, matPlein)
  ajouter(betons, matBeton)
  ajouter(fers, matFer).customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: fer, alphaTest: 0.5 })

  // ---------- le sol et le socle ----------
  {
    const g = new THREE.PlaneGeometry(B, B, GR, GR)
    g.rotateX(-Math.PI / 2)
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setY(i, relief[i])
    g.computeVertexNormals()
    const sol = new THREE.Mesh(g, matSol)
    sol.receiveShadow = true
    sol.castShadow = true
    groupe.add(sol)

    const T = 26
    const lot = new Lot()
    const seg = (x0: number, z0: number, x1: number, z1: number, b: number, n: V) => {
      for (let i = 0; i < GR; i++) {
        const t0 = i / GR
        const t1 = (i + 1) / GR
        const a: P2 = [x0 + (x1 - x0) * t0, z0 + (z1 - z0) * t0]
        const c: P2 = [x0 + (x1 - x0) * t1, z0 + (z1 - z0) * t1]
        const ha = hauteur(a[0], a[1])
        const hc = hauteur(c[0], c[1])
        const v1 = 1 - b / 4
        const v0 = 1 - (b + 1) / 4
        lot.tri([a[0], -T, a[1]], [c[0], -T, c[1]], [c[0], hc, c[1]], [t0, v0], [t1, v0], [t1, v1], BLANC, BLANC, BLANC, n)
        lot.tri([a[0], -T, a[1]], [c[0], hc, c[1]], [a[0], ha, a[1]], [t0, v0], [t1, v1], [t0, v1], BLANC, BLANC, BLANC, n)
      }
    }
    const h = B / 2
    seg(-h, h, h, h, 0, [0, 0, 1])
    seg(h, h, h, -h, 1, [1, 0, 0])
    seg(h, -h, -h, -h, 2, [0, 0, -1])
    seg(-h, -h, -h, h, 3, [-1, 0, 0])
    const flancs = new THREE.Mesh(lot.geometrie(), matCotes)
    flancs.castShadow = true
    flancs.receiveShadow = true
    groupe.add(flancs)

    // plinthe de bois sombre, filet de laiton
    const pl = new THREE.Mesh(new THREE.BoxGeometry(B + 7, 13, B + 7), matSocle)
    pl.position.y = -T - 6.5
    pl.castShadow = true
    pl.receiveShadow = true
    groupe.add(pl)
    const laiton = new THREE.Mesh(new THREE.BoxGeometry(B + 7.6, 0.7, B + 7.6), new THREE.MeshLambertMaterial({ color: '#94702f' }))
    laiton.position.y = -T - 0.3
    groupe.add(laiton)

    // ombre douce sous l’objet : celle d’un socle posé, pas un halo
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')!
    ctx.filter = 'blur(22px)'
    ctx.fillStyle = 'rgba(18,12,6,.72)'
    ctx.fillRect(66, 66, 380, 380)
    const ombre = new THREE.Mesh(new THREE.PlaneGeometry(B * 1.38, B * 1.38), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }))
    ombre.rotation.x = -Math.PI / 2
    ombre.position.set(2.5, -T - 13.1, 3.5)
    scene.add(ombre)
  }

  await souffle()
  // ---------- clôtures, poteaux, passants ----------
  {
    const crepis = ['#d8cdb4', '#c9c0ae', '#e2d6bd', '#b8b3a6', '#d9b98c', '#a9c4b6'].map(lin)
    for (const c of D.clotures) {
      const coul = crepis[Math.floor(c.c * 6) % 6]
      for (let i = 1; i < c.p.length; i++) {
        const [ax, az] = c.p[i - 1]
        const [bx, bz] = c.p[i]
        const l = Math.hypot(bx - ax, bz - az)
        const mx = (ax + bx) / 2
        const mz = (az + bz) / 2
        const y = hauteur(mx, mz)
        pleins.boite(mx, y + c.h / 2, mz, l + 0.1, c.h, 0.28, Math.atan2(bz - az, bx - ax), coul, fois(coul, 0.68))
        pleins.boite(mx, y + c.h + 0.05, mz, l + 0.14, 0.1, 0.42, Math.atan2(bz - az, bx - ax), fois(coul, 1.08))
      }
    }
    const fil: number[] = []
    const bois = lin('#5e4a36')
    for (const ligne of D.poteaux) {
      ligne.forEach(([x, z], i) => {
        const y = hauteur(x, z)
        pleins.boite(x, y + 4.4, z, 0.2, 8.8, 0.2, 0, bois, fois(bois, 0.7))
        pleins.boite(x, y + 8.3, z, 1.5, 0.12, 0.14, i, bois)
        if (i === 0) return
        const [px, pz] = ligne[i - 1]
        const py = hauteur(px, pz)
        for (const dec of [-0.55, 0, 0.55]) {
          const seg = 8
          for (let k = 0; k < seg; k++) {
            const t0 = k / seg
            const t1 = (k + 1) / seg
            const sag = (t: number) => 4 * t * (1 - t) * 0.62
            fil.push(px + (x - px) * t0 + dec * 0.3, py + 8.3 + (y - py) * t0 - sag(t0), pz + (z - pz) * t0 + dec, px + (x - px) * t1 + dec * 0.3, py + 8.3 + (y - py) * t1 - sag(t1), pz + (z - pz) * t1 + dec)
          }
        }
      })
    }
    const gf = new THREE.BufferGeometry()
    gf.setAttribute('position', new THREE.Float32BufferAttribute(fil, 3))
    groupe.add(new THREE.LineSegments(gf, new THREE.LineBasicMaterial({ color: 0x14130f, transparent: true, opacity: 0.55 })))

    const corps = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.24, 1.0, 2, 8), new THREE.MeshLambertMaterial(), D.gens.length)
    const tetes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ color: '#3a271b' }), D.gens.length)
    corps.castShadow = true
    const hab = ['#d83a34', '#f2c230', '#1f8a70', '#2b67b7', '#f4efe2', '#c32f83', '#2a2b33', '#e07a2f', '#f8f6ef'].map(h => new THREE.Color(h))
    const M = new THREE.Matrix4()
    D.gens.forEach(([x, z, c], i) => {
      const y = hauteur(x, z)
      M.makeTranslation(x, y + 0.86, z)
      corps.setMatrixAt(i, M)
      corps.setColorAt(i, hab[Math.floor(c * 9) % 9])
      M.makeTranslation(x, y + 1.78, z)
      tetes.setMatrixAt(i, M)
    })
    groupe.add(corps, tetes)
  }

  await souffle()
  // ---------- arbres : couronnes de feuilles ----------
  const verts = ['#2d5a30', '#376436', '#426f38', '#29502f', '#4e7a3c', '#335c33', '#5a8040'].map(h => new THREE.Color(h))
  {
    const lot = new Lot()
    const tirage = (i: number, j: number) => hache(i + 1.7, j + 0.3)
    for (let i = 0; i < 74; i++) {
      // des cartes de feuillage réparties sur une calotte
      const u = tirage(i, 1)
      const v = tirage(i, 2)
      const th = u * Math.PI * 2
      const cp = 1 - v * 1.45
      const sp = Math.sqrt(Math.max(0, 1 - cp * cp))
      const d: V = [Math.cos(th) * sp, cp * 0.78, Math.sin(th) * sp]
      const R = 0.68 + tirage(i, 3) * 0.3
      const c: V = [d[0] * R, d[1] * R, d[2] * R]
      const t1 = norm(cross(d, [tirage(i, 4) - 0.5, tirage(i, 5) - 0.5, tirage(i, 6) - 0.5]))
      const t2 = norm(cross(d, t1))
      const S = 0.6 + tirage(i, 7) * 0.3
      const a: V = [c[0] - t1[0] * S - t2[0] * S, c[1] - t1[1] * S - t2[1] * S, c[2] - t1[2] * S - t2[2] * S]
      const b: V = [c[0] + t1[0] * S - t2[0] * S, c[1] + t1[1] * S - t2[1] * S, c[2] + t1[2] * S - t2[2] * S]
      const e: V = [c[0] + t1[0] * S + t2[0] * S, c[1] + t1[1] * S + t2[1] * S, c[2] + t1[2] * S + t2[2] * S]
      const f: V = [c[0] - t1[0] * S + t2[0] * S, c[1] - t1[1] * S + t2[1] * S, c[2] - t1[2] * S + t2[2] * S]
      const k = 0.5 + (d[1] + 0.8) * 0.36
      const col = fois(BLANC, k)
      lot.quad(a, b, e, f, norm([d[0], d[1] + 0.25, d[2]]), [0, 0, 1, 1], col)
    }
    const geo = lot.geometrie()
    const mat = new THREE.MeshLambertMaterial({ map: feuilles, alphaTest: 0.45, vertexColors: true, side: THREE.DoubleSide })
    const inst = new THREE.InstancedMesh(geo, mat, D.arbres.length * 2)
    inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: feuilles, alphaTest: 0.45 })
    inst.castShadow = true
    inst.receiveShadow = true
    const troncs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.32, 1, 7), new THREE.MeshLambertMaterial({ color: '#57412d' }), D.arbres.length)
    troncs.castShadow = true
    const M = new THREE.Matrix4()
    const Q = new THREE.Quaternion()
    const E = new THREE.Euler()
    let k = 0
    D.arbres.forEach(([x, z, s, c], i) => {
      const y = hauteur(x, z)
      const haut = 1.25 * s
      M.compose(new THREE.Vector3(x, y + haut / 2, z), Q.identity(), new THREE.Vector3(1, haut, 1))
      troncs.setMatrixAt(i, M)
      for (let j = 0; j < 2; j++) {
        E.set(0, hache(i, j + 2) * 6.28, 0)
        const t = s * (j === 0 ? 1.12 : 0.74)
        const a = hache(i, j) * 6.28
        const r = j === 0 ? 0 : s * 0.62
        const ax = 0.82 + hache(i, j + 5) * 0.42
        const az = 0.82 + hache(i, j + 6) * 0.42
        M.compose(new THREE.Vector3(x + Math.cos(a) * r, y + haut + s * (j === 0 ? 0.5 : 0.28), z + Math.sin(a) * r), Q.setFromEuler(E), new THREE.Vector3(t * ax, t * (0.66 + hache(i, j + 7) * 0.26), t * az))
        inst.setMatrixAt(k, M)
        inst.setColorAt(k, verts[Math.floor(c * 7 + j) % 7])
        k++
      }
    })
    groupe.add(inst, troncs)
  }

  await souffle()
  // ---------- palmiers ----------
  {
    const stipe = new Lot()
    const brun = lin('#80694e')
    const ex = (h: number) => (h * h) / 90
    for (let s = 0; s < 7; s++) {
      const a0 = (s / 7) * Math.PI * 2
      const a1 = ((s + 1) / 7) * Math.PI * 2
      for (let y = 0; y < 6; y++) {
        const R0 = 0.36 - y * 0.03
        const R1 = 0.36 - (y + 1) * 0.03
        const h0 = (y / 6) * 11
        const h1 = ((y + 1) / 6) * 11
        const p = (R: number, a: number, h: number): V => [Math.cos(a) * R + ex(h), h, Math.sin(a) * R]
        stipe.quad(p(R0, a0, h0), p(R0, a1, h0), p(R1, a1, h1), p(R1, a0, h1), norm([Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)]), [0, 0, 1, 1], fois(brun, 0.74 + y * 0.05))
      }
    }
    const fr = new Lot()
    const top: V = [121 / 90, 11, 0]
    for (let f = 0; f < 15; f++) {
      const a = (f / 15) * Math.PI * 2 + (f % 2) * 0.13
      const L = 5.6 + (f % 3) * 0.9
      const lever = f % 2 ? 0.8 : 0.3
      const dir: V = [Math.cos(a), 0, Math.sin(a)]
      const lat: V = [-Math.sin(a), 0, Math.cos(a)]
      const larg = 1.15
      const P = (t: number, c: number): V => {
        const d = t * L
        const y = lever * d - 0.17 * d * d
        return [top[0] + dir[0] * d + lat[0] * c, top[1] + y - Math.abs(c) * 0.28, top[2] + dir[2] * d + lat[2] * c]
      }
      const teinte = fois(BLANC, f % 3 === 0 ? 1 : f % 3 === 1 ? 0.84 : 0.92)
      for (let i = 0; i < 8; i++) {
        const t0 = i / 8
        const t1 = (i + 1) / 8
        for (const s of [-1, 1]) {
          fr.quad(P(t0, 0), P(t1, 0), P(t1, s * larg), P(t0, s * larg), [0, 1, 0], [t0, 0.5, t1, s > 0 ? 1 : 0], fois(teinte, 0.74 + t0 * 0.3), teinte)
        }
      }
    }
    const nbp = D.palmiers.length
    const mP = new THREE.MeshLambertMaterial({ map: palme, alphaTest: 0.4, vertexColors: true, side: THREE.DoubleSide, color: '#4e7a3a' })
    const iF = new THREE.InstancedMesh(fr.geometrie(), mP, nbp)
    iF.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: palme, alphaTest: 0.4 })
    iF.castShadow = true
    iF.receiveShadow = true
    const iS = new THREE.InstancedMesh(stipe.geometrie(), new THREE.MeshLambertMaterial({ vertexColors: true }), nbp)
    iS.castShadow = true
    const M = new THREE.Matrix4()
    const E = new THREE.Euler()
    const Q = new THREE.Quaternion()
    D.palmiers.forEach(([x, z, a, s], i) => {
      E.set(0, a, 0)
      M.compose(new THREE.Vector3(x, hauteur(x, z), z), Q.setFromEuler(E), new THREE.Vector3(s, s, s))
      iF.setMatrixAt(i, M)
      iS.setMatrixAt(i, M)
    })
    groupe.add(iF, iS)
  }

  await souffle()
  // ---------- canots et tap-taps ----------
  {
    const lot = new Lot()
    const profil = [0.02, 0.5, 0.82, 1, 1, 0.8, 0.46, 0.02]
    const L = 7
    for (let i = 0; i < profil.length - 1; i++) {
      const x0 = (i / (profil.length - 1) - 0.5) * L
      const x1 = ((i + 1) / (profil.length - 1) - 0.5) * L
      const w0 = profil[i] * 0.72
      const w1 = profil[i + 1] * 0.72
      for (const s of [-1, 1]) {
        lot.quad([x0, 0, s * w0 * 0.55], [x1, 0, s * w1 * 0.55], [x1, 0.72, s * w1], [x0, 0.72, s * w0], norm([0, 0.5, s]), [0, 0, 1, 1], BLANC)
      }
      lot.quad([x0, 0.3, -w0 * 0.9], [x1, 0.3, -w1 * 0.9], [x1, 0.3, w1 * 0.9], [x0, 0.3, w0 * 0.9], [0, 1, 0], [0, 0, 1, 1], fois(BLANC, 0.5))
    }
    const inst = new THREE.InstancedMesh(lot.geometrie(), new THREE.MeshLambertMaterial({ vertexColors: true }), D.canots.length)
    inst.castShadow = true
    const couleurs = ['#c23a2c', '#e9c64a', '#f1ede2', '#2e7f79', '#2d4f8e', '#e07a2f'].map(h => new THREE.Color(h))
    const M = new THREE.Matrix4()
    const E = new THREE.Euler()
    const Q = new THREE.Quaternion()
    D.canots.forEach(([x, z, a, c, flotte], i) => {
      E.set(0, a, 0)
      M.compose(new THREE.Vector3(x, flotte ? 0.05 : hauteur(x, z) + 0.05, z), Q.setFromEuler(E), new THREE.Vector3(1, 1, 1))
      inst.setMatrixAt(i, M)
      inst.setColorAt(i, couleurs[Math.floor(c * 6) % 6])
    })
    groupe.add(inst)

    const v = new Lot()
    const noir = lin('#16171a')
    v.boite(0.9, 1.5, 0, 3.9, 1.7, 2.1, 0, BLANC)
    v.boite(-1.75, 1.15, 0, 1.5, 1.2, 2, 0, BLANC)
    v.boite(0.9, 2.42, 0, 4.2, 0.14, 2.3, 0, fois(BLANC, 1.1))
    v.boite(-1.75, 1.45, 0, 0.8, 0.5, 1.92, 0, lin('#27313a'))
    for (const q of [-1.9, 1.7]) for (const s of [-1, 1]) v.boite(q, 0.42, s * 1.02, 0.86, 0.84, 0.3, 0, noir)
    const vi = new THREE.InstancedMesh(v.geometrie(), new THREE.MeshLambertMaterial({ vertexColors: true }), D.vehicules.length)
    vi.castShadow = true
    const tap = ['#d83a34', '#f2c230', '#1f8a70', '#2b67b7', '#f07f2e', '#c32f83', '#f4efe2'].map(h => new THREE.Color(h))
    D.vehicules.forEach(([x, z, a, c], i) => {
      E.set(0, -a, 0)
      M.compose(new THREE.Vector3(x, hauteur(x, z) + 0.02, z), Q.setFromEuler(E), new THREE.Vector3(1, 1, 1))
      vi.setMatrixAt(i, M)
      vi.setColorAt(i, tap[Math.floor(c * 7) % 7])
    })
    groupe.add(vi)
  }

  // ---------- lumière ----------
  const sun = new THREE.DirectionalLight('#fff0dc', 3.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  const cam = sun.shadow.camera as THREE.OrthographicCamera
  const e = B * 0.82
  cam.left = -e
  cam.right = e
  cam.top = e
  cam.bottom = -e
  cam.near = 50
  cam.far = 2400
  sun.shadow.bias = -0.0002
  sun.shadow.normalBias = 0.4
  sun.shadow.radius = 2.4
  sun.shadow.blurSamples = 14
  const ciel = new THREE.HemisphereLight('#f2f6fb', '#b8a488', 1.55)
  scene.add(sun, sun.target, ciel)

  const a = (D.angle * Math.PI) / 180
  const est = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a))
  const nord = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a))

  function soleil(elevation: number, azimut: number, chaud: number, nuit: boolean) {
    const el = (Math.max(14, Math.min(58, nuit ? 52 : elevation)) * Math.PI) / 180
    const az = ((nuit ? 150 : azimut) * Math.PI) / 180
    const dir = new THREE.Vector3().addScaledVector(est, Math.sin(az) * Math.cos(el)).addScaledVector(nord, Math.cos(az) * Math.cos(el)).add(new THREE.Vector3(0, Math.sin(el), 0))
    sun.position.copy(dir).multiplyScalar(1200)
    sun.target.position.set(0, 0, 0)
    sun.target.updateMatrixWorld()
    sun.color.set(nuit ? '#8ea6e0' : new THREE.Color('#fff4e6').lerp(new THREE.Color('#ffb675'), chaud).getStyle())
    sun.intensity = nuit ? 0.9 : 3.9
    scene.environmentIntensity = nuit ? 0.17 : 0.46
    ciel.intensity = nuit ? 0.32 : 1.55
    ciel.color.set(nuit ? '#7f92c8' : '#f2f6fb')
    ciel.groundColor.set(nuit ? '#2a2f44' : '#b8a488')
    matFacade.emissiveIntensity = nuit ? 1.9 : 0
    matSol.emissiveIntensity = nuit ? 1.5 : 0
    renderer.shadowMap.needsUpdate = true
    aRendre = true
  }

  // ---------- caméra ----------
  const camera = new THREE.PerspectiveCamera(24, 1, 20, 8000)
  const repos = { az: 0.16, el: 0.74, d: 1 }
  const etat = { sx: 0, sy: 0, csx: 0, csy: 0, pas: 0, cpas: 0 }
  const cible = new THREE.Vector3()
  const galerie = new THREE.Vector3(D.galerie[0], yGal, D.galerie[1])
  // la porte de la galerie : le milieu de sa plus longue façade sur rue, et le sens de la rue
  const porte = (() => {
    const m = D.maisons.find(q => q.g)
    let mieux = { x: D.galerie[0], z: D.galerie[1], nx: 0, nz: 1, l: 0 }
    if (m)
      m.p.forEach((a, i) => {
        const b = m.p[(i + 1) % m.p.length]
        const l = Math.hypot(b[0] - a[0], b[1] - a[1])
        if (m.f[i] && l > mieux.l) mieux = { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, nx: (b[1] - a[1]) / l, nz: -(b[0] - a[0]) / l, l }
      })
    return mieux
  })()
  const azPorte = (() => {
    let a = Math.atan2(porte.nx, porte.nz)
    while (a - repos.az > Math.PI) a -= Math.PI * 2
    while (a - repos.az < -Math.PI) a += Math.PI * 2
    return a
  })()
  const yRue = hauteur(porte.x, porte.z) + 2.4
  let aRendre = true
  let raf = 0
  let vivant = true

  function placerCamera() {
    const W = canvas.clientWidth || 1
    const Hc = canvas.clientHeight || 1
    camera.aspect = W / Hc
    // à l’écran, le socle occupe `echelle()` de la hauteur du canevas
    const tan = Math.tan((camera.fov * Math.PI) / 360)
    const dist0 = (B * 0.86) / (options.echelle() * tan)
    const p = etat.cpas
    const lisse = (t: number) => {
      const x = Math.min(1, Math.max(0, t))
      return x * x * (3 - 2 * x)
    }
    const e_ = lisse(p / 0.76) // la descente dans les rues
    const e2 = lisse((p - 0.68) / 0.32) // puis la poussée vers la porte
    const d = dist0 * Math.pow(0.085, e_) * Math.pow(0.26, e2)
    const souris = 1 - e_ * 0.72
    const az = repos.az + (azPorte - repos.az) * lisse(p / 0.9) + etat.csx * 0.11 * souris
    const el = repos.el + etat.csy * 0.055 * souris - e_ * 0.33 - e2 * 0.07
    cible.set(0, -12, 14).lerp(new THREE.Vector3(D.galerie[0], hauteur(D.galerie[0], D.galerie[1]) + 2.5, D.galerie[1]), e_).lerp(new THREE.Vector3(porte.x, yRue, porte.z), e2)
    camera.position.set(cible.x + Math.sin(az) * Math.cos(el) * d, cible.y + Math.sin(el) * d, cible.z + Math.cos(az) * Math.cos(el) * d)
    camera.near = Math.max(4, d * 0.2)
    camera.far = d + B * 4
    camera.lookAt(cible)
    camera.updateProjectionMatrix()
  }

  // ---------- le rendu : profondeur de champ de macro, sortie filmique ----------
  const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true }
  const rtScene = new THREE.WebGLRenderTarget(4, 4, { ...opts, samples: 3, depthTexture: new THREE.DepthTexture(4, 4) })
  const rtA = new THREE.WebGLRenderTarget(4, 4, { ...opts, depthBuffer: false })
  const rtB = new THREE.WebGLRenderTarget(4, 4, { ...opts, depthBuffer: false })
  const plein = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
  const scenePost = new THREE.Scene()
  scenePost.add(plein)
  const camPost = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }'
  const flou = new THREE.ShaderMaterial({
    vertexShader: VS,
    uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } },
    fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec4 c = texture2D(t,vUv)*.227;
        c += (texture2D(t,vUv+dir*1.385)+texture2D(t,vUv-dir*1.385))*.316;
        c += (texture2D(t,vUv+dir*3.231)+texture2D(t,vUv-dir*3.231))*.0703;
        gl_FragColor=c; }`,
    depthTest: false,
    depthWrite: false,
  })
  const finale = new THREE.ShaderMaterial({
    vertexShader: VS,
    uniforms: { t: { value: null }, b: { value: null }, d: { value: null }, near: { value: 1 }, far: { value: 10 }, focus: { value: 100 }, plage: { value: 100 }, expo: { value: 1.0 } },
    fragmentShader: `uniform sampler2D t,b,d; uniform float near,far,focus,plage,expo; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
      vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
      void main(){
        float z = texture2D(d,vUv).x;
        float vz = (near*far)/((far-near)*z-far);
        float coc = smoothstep(.0,1.,abs(-vz-focus)/plage);
        if (z>=1.) coc = 1.;
        vec4 c = mix(texture2D(t,vUv), texture2D(b,vUv), coc);
        float a = max(c.a,1e-4);
        vec3 col = c.rgb/a*expo;
        col = aces(col);
        gl_FragColor = vec4(srgb(col)*c.a, c.a);
      }`,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  })

  function dimensionner() {
    const W = canvas.clientWidth
    const Hc = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, options.dprMax ?? (W * Hc > 1.1e6 ? 1.25 : 2))
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, Hc, false)
    rtScene.setSize(W * dpr, Hc * dpr)
    rtA.setSize((W * dpr) >> 1, (Hc * dpr) >> 1)
    rtB.setSize((W * dpr) >> 1, (Hc * dpr) >> 1)
    aRendre = true
  }

  const lerpPlage = () => 0.58 - 0.3 * etat.cpas

  // ne calcule que la zone où se trouve le socle : au repos, un cinquième de l’écran
  const coin = new THREE.Vector3()
  function zone(): [number, number, number, number] {
    const W = rtScene.width
    const Hc = rtScene.height
    if (etat.cpas > 0.3) return [0, 0, W, Hc]
    let x0 = 1
    let x1 = -1
    let y0 = 1
    let y1 = -1
    const h = (B / 2) * 1.2
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        for (const y of [-40, 24]) {
          coin.set(sx * h, y, sz * h).project(camera)
          x0 = Math.min(x0, coin.x)
          x1 = Math.max(x1, coin.x)
          y0 = Math.min(y0, coin.y)
          y1 = Math.max(y1, coin.y)
        }
    const X0 = Math.max(0, Math.floor((x0 * 0.5 + 0.5) * W) - 8)
    const Y0 = Math.max(0, Math.floor((y0 * 0.5 + 0.5) * Hc) - 8)
    const X1 = Math.min(W, Math.ceil((x1 * 0.5 + 0.5) * W) + 8)
    const Y1 = Math.min(Hc, Math.ceil((y1 * 0.5 + 0.5) * Hc) + 8)
    return [X0, Y0, Math.max(1, X1 - X0), Math.max(1, Y1 - Y0)]
  }

  function peindre() {
    const [zx, zy, zw, zh] = zone()
    const dpr = renderer.getPixelRatio()
    rtScene.scissorTest = true
    rtScene.scissor.set(zx, zy, zw, zh)
    rtScene.viewport.set(0, 0, rtScene.width, rtScene.height)
    for (const q of [rtA, rtB]) {
      q.scissorTest = true
      q.scissor.set(zx >> 1, zy >> 1, (zw >> 1) + 2, (zh >> 1) + 2)
    }
    renderer.setRenderTarget(rtScene)
    renderer.clear()
    renderer.render(scene, camera)
    const px = 1 / rtA.width
    const py = 1 / rtA.height
    const rayon = (0.72 + etat.cpas * 0.5) * Math.max(1, dpr * 0.8)
    plein.material = flou
    let source = rtScene.texture
    for (const [cx, cy, cible_] of [
      [rayon, 0, rtA],
      [0, rayon, rtB],
      [rayon * 2, 0, rtA],
      [0, rayon * 2, rtB],
    ] as [number, number, THREE.WebGLRenderTarget][]) {
      flou.uniforms.t.value = source
      flou.uniforms.dir.value.set(px * cx, py * cy)
      renderer.setRenderTarget(cible_)
      renderer.clear()
      renderer.render(scenePost, camPost)
      source = cible_.texture
    }
    plein.material = finale
    finale.uniforms.t.value = rtScene.texture
    finale.uniforms.b.value = rtB.texture
    finale.uniforms.d.value = rtScene.depthTexture
    finale.uniforms.near.value = camera.near
    finale.uniforms.far.value = camera.far
    const dist = camera.position.distanceTo(cible)
    finale.uniforms.focus.value = dist
    finale.uniforms.plage.value = Math.max(16, dist * lerpPlage()) // profondeur nette étroite : c’est elle qui dit « miniature »
    renderer.setRenderTarget(null)
    renderer.setScissorTest(false)
    renderer.clear()
    renderer.setScissorTest(true)
    renderer.setScissor(zx / dpr, zy / dpr, zw / dpr, zh / dpr)
    renderer.render(scenePost, camPost)
    renderer.setScissorTest(false)
  }

  function boucle() {
    if (!vivant) return
    raf = requestAnimationFrame(boucle)
    const k = 0.085
    etat.csx += (etat.sx - etat.csx) * k
    etat.csy += (etat.sy - etat.csy) * k
    etat.cpas += (etat.pas - etat.cpas) * 0.18
    const bouge = Math.abs(etat.sx - etat.csx) + Math.abs(etat.sy - etat.csy) + Math.abs(etat.pas - etat.cpas) > 0.0004
    if (bouge) aRendre = true
    if (!aRendre) return
    aRendre = false
    placerCamera()
    peindre()
    options.apresImage?.()
  }

  soleil(38, 120, 0.2, false)
  dimensionner()
  placerCamera()
  for (const t of [solC, solN, solR, solE, facC, facN, facE, toleC, toleN, cotes, fer, beton, feuilles, palme]) {
    renderer.initTexture(t)
    await souffle()
  }
  await renderer.compileAsync(scene, camera)
  await souffle()
  peindre()

  // banc d’essai : si cet appareil ne tient pas la cadence, l’affiche fixe reste
  if (options.exigeant) {
    const temps: number[] = []
    for (let i = 0; i < 7; i++) {
      await new Promise(r => requestAnimationFrame(r))
      const t0 = performance.now()
      etat.csx = Math.sin(i) * 0.3
      placerCamera()
      peindre()
      renderer.getContext().finish()
      temps.push(performance.now() - t0)
    }
    etat.csx = 0
    temps.sort((x, y) => x - y)
    if (temps[3] > 70) {
      vivant = false
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      throw new Error('appareil trop lent')
    }
  }
  raf = requestAnimationFrame(boucle)

  const v = new THREE.Vector3()
  return {
    regler({ souris, pas }) {
      if (souris) [etat.sx, etat.sy] = souris
      if (pas !== undefined) etat.pas = pas
      aRendre = true
    },
    soleil,
    dimensionner,
    pointGalerie() {
      v.copy(galerie).project(camera)
      return { x: (v.x * 0.5 + 0.5) * canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * canvas.clientHeight }
    },
    rendre() {
      placerCamera()
      peindre()
    },
    detruire() {
      vivant = false
      cancelAnimationFrame(raf)
      envRT.dispose()
      pmrem.dispose()
      rtScene.dispose()
      rtA.dispose()
      rtB.dispose()
      renderer.dispose()
    },
  }
}
