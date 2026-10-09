// La fenêtre : le soleil de Jacmel passe les persiennes et pose des lames de lumière sur le mur.
// Géométrie pilotée par les variables CSS de LightProvider ; ombre de palmes, lente et irrégulière.
import { useMemo, type CSSProperties } from 'react'

type Props = { fronds?: boolean; className?: string; style?: CSSProperties }

export function Daylight({ fronds = true, className = '', style }: Props) {
  return (
    <div className={`daylight ${className}`} style={style} aria-hidden>
      <div className="daylight__patch" />
      {fronds && (
        <div className="daylight__fronds">
          <div className="daylight__sway">
            <Fronds />
          </div>
        </div>
      )}
    </div>
  )
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Une palme de cocotier : un rachis arqué et ses folioles, en silhouette. */
function frond(x0: number, y0: number, len: number, dir: number, curl: number, rand: () => number) {
  const n = 34
  let x = x0
  let y = y0
  let a = dir
  const step = len / n
  let rachis = `M${x.toFixed(1)} ${y.toFixed(1)}`
  let leaves = ''
  for (let i = 1; i <= n; i++) {
    const t = i / n
    a += curl / n
    x += Math.cos(a) * step
    y += Math.sin(a) * step
    rachis += ` L${x.toFixed(1)} ${y.toFixed(1)}`
    if (i < 3) continue
    const L = len * 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (0.8 + rand() * 0.4)
    for (const side of [-1, 1]) {
      const spread = (1.15 - 0.55 * t) * side + (rand() - 0.5) * 0.25
      const la = a + spread
      const ex = x + Math.cos(la) * L
      const ey = y + Math.sin(la) * L + L * 0.38 // la foliole retombe
      const cx = x + Math.cos(la) * L * 0.55
      const cy = y + Math.sin(la) * L * 0.55 - L * 0.05
      leaves += `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `
    }
  }
  return { rachis, leaves }
}

function Fronds() {
  const paths = useMemo(() => {
    const r = rng(1987)
    return [
      frond(-60, 120, 820, 0.18, 0.9, r),
      frond(-40, 420, 700, -0.12, 0.75, r),
      frond(140, -80, 620, 0.95, 0.55, r),
    ]
  }, [])
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMinYMin slice">
      {paths.map((p, i) => (
        <g key={i} fill="none" stroke="#000" strokeLinecap="round">
          <path d={p.rachis} strokeWidth={9} />
          <path d={p.leaves} strokeWidth={6} />
        </g>
      ))}
    </svg>
  )
}
