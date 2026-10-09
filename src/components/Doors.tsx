// Les persiennes : deux battants de bois peint, lames orientables, enseigne peinte au-dessus.
// Pilotées par deux variables CSS : --louver (0 fermé → 1 lames ouvertes)
// et --open (0 battants fermés → 1 battants ouverts).
import { forwardRef, type CSSProperties, type ReactNode } from 'react'

const HAUT = 12
const BAS = 9

function Leaf({ side }: { side: 'l' | 'r' }) {
  const slats = (n: number, offset: number) =>
    Array.from({ length: n }, (_, i) => <span key={i} className="doors__slat" style={{ '--i': i + offset } as CSSProperties} />)
  return (
    <div className={`doors__leaf doors__leaf--${side}`}>
      <div className="doors__rail doors__rail--top" />
      <div className="doors__panel doors__panel--upper">{slats(HAUT, 0)}</div>
      <div className="doors__rail doors__rail--mid">
        <span className="doors__latch" />
      </div>
      <div className="doors__panel doors__panel--lower">{slats(BAS, HAUT)}</div>
      <div className="doors__rail doors__rail--bottom" />
      <span className="doors__shade" />
    </div>
  )
}

type Props = {
  sign: ReactNode
  className?: string
  style?: CSSProperties
}

export const Doors = forwardRef<HTMLDivElement, Props>(function Doors({ sign, className = '', style }, ref) {
  return (
    <div ref={ref} className={`doors ${className}`} style={style} aria-hidden>
      <div className="doors__fascia">
        <div className="doors__sign">{sign}</div>
      </div>
      <div className="doors__frame">
        <Leaf side="l" />
        <Leaf side="r" />
      </div>
      <span className="doors__lamp" />
    </div>
  )
})
