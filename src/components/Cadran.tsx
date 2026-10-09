// Le cadran : le soleil (ou la lune) sur son cercle. Glisser change la lumière de la maison ;
// les horaires d’ouverture, eux, restent ceux de l’heure réelle.
import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useLight } from '../state/light'
import { heure, jacmelTime } from '../lib/jacmel'

const DAY = 86_400_000
const MIN = 60_000
const R = 38
const C = 50

export function Cadran({ size = 104, className = '' }: { size?: number; className?: string }) {
  const { t, sun, simulated, setSimulated, setScrubbing, night, moon, ambiance } = useLight()
  const S = sun.sunrise
  const E = sun.sunset
  const svg = useRef<SVGSVGElement>(null)

  const nightOf = (ms: number) => (ms < S ? [E - DAY, S] : [E, S + DAY])

  const angleOf = (ms: number) => {
    if (ms >= S && ms <= E) return (180 * (ms - S)) / (E - S)
    const [a, b] = nightOf(ms)
    return 180 + (180 * (ms - a)) / (b - a)
  }
  const timeOf = (deg: number) => {
    if (deg <= 180) return S + ((E - S) * deg) / 180
    const [a, b] = nightOf(t)
    return a + ((b - a) * (deg - 180)) / 180
  }

  const theta = angleOf(t)
  const rad = (theta * Math.PI) / 180
  const x = C - R * Math.cos(rad)
  const y = C - R * Math.sin(rad)

  const fromPointer = (e: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * 100
    const py = ((e.clientY - r.top) / r.height) * 100
    let a = (Math.atan2(-(py - C), -(px - C)) * 180) / Math.PI
    if (a < 0) a += 360
    setSimulated(timeOf(a))
  }

  const onKey = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 }
    if (e.key in steps) {
      e.preventDefault()
      setSimulated(t + steps[e.key] * MIN)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setSimulated(S + MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      setSimulated(E - MIN)
    } else if (e.key === 'Escape' && simulated) {
      e.stopPropagation()
      setSimulated(null)
    }
  }

  const { h, min } = jacmelTime(t)
  // lune : un disque, et son ombre décalée selon la phase (0 nouvelle, 0,5 pleine)
  const clip = useId()
  const shadowDx = (moon < 0.5 ? -1 : 1) * 2 * 6.2 * (1 - 2 * Math.abs(moon - 0.5))
  return (
    <div className={`cadran ${night ? 'is-night' : ''} ${className}`}>
      <svg
        ref={svg}
        className="cadran__dial"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="slider"
        tabIndex={0}
        aria-label="Heure de la lumière à Jacmel"
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={h * 60 + min}
        aria-valuetext={`${heure(t)}, ${ambiance}`}
        onKeyDown={onKey}
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setScrubbing(true)
          fromPointer(e)
        }}
        onPointerMove={e => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e)
        }}
        onPointerUp={e => {
          e.currentTarget.releasePointerCapture(e.pointerId)
          setScrubbing(false)
        }}
        onPointerCancel={() => setScrubbing(false)}
      >
        <circle className="cadran__ring" cx={C} cy={C} r={R} />
        <path className="cadran__day" d={`M${C - R} ${C} A${R} ${R} 0 0 1 ${C + R} ${C}`} />
        <line className="cadran__horizon" x1={4} y1={C} x2={96} y2={C} />
        <line className="cadran__tick" x1={C} y1={C - R - 4} x2={C} y2={C - R + 3} />
        <line className="cadran__tick" x1={C} y1={C + R - 3} x2={C} y2={C + R + 4} />
        <line className="cadran__hand" x1={C} y1={C} x2={x} y2={y} />
        {night ? (
          <g className="cadran__moon" transform={`translate(${x} ${y})`}>
            <clipPath id={clip}>
              <circle r={6.2} />
            </clipPath>
            <circle r={6.2} className="cadran__moon-disc" />
            <circle r={6.4} cx={shadowDx} className="cadran__moon-shade" clipPath={`url(#${clip})`} />
          </g>
        ) : (
          <circle className="cadran__sun" cx={x} cy={y} r={5.6} />
        )}
      </svg>
      <div className="cadran__legend">
        <span className="cadran__time ui">{heure(t)}</span>
        <span className="label">{simulated ? 'Lumière simulée' : 'Lumière réelle, Jacmel'}</span>
        <span className="cadran__sun-times label">
          Lever {heure(S)} · coucher {heure(E)}
        </span>
        {simulated && (
          <button type="button" className="cadran__reset label press" onClick={() => setSimulated(null)}>
            Revenir à maintenant
          </button>
        )}
      </div>
    </div>
  )
}
