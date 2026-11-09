// La maison aux persiennes : une façade de Jacmel, sa porte-fenêtre à deux battants.
// Trois variables CSS pilotent tout : --latch (la béquille), --louver (0 lames fermées → 1 ouvertes),
// --open (0 battants fermés → 1 battants ouverts, on passe le seuil).
// La baie centrale est en vraie 3D, lame par lame ; les baies voisines sont peintes à plat.
import { forwardRef, type CSSProperties } from 'react'
import { MAISON } from '../content/site'

const HAUT = 15
const BAS = 7
const CHARNIERES = [8.9, 23.7, 37.1]

/** Hasard déterministe : chaque lame garde ses défauts d’un rendu à l’autre. */
const alea = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function Lames({ n, depuis, graine }: { n: number; depuis: number; graine: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const k = depuis + i + graine
        return (
          <span
            key={i}
            className="doors__slat"
            style={
              {
                '--i': depuis + i + graine,
                '--a': `${((alea(k) - 0.5) * 2.4).toFixed(2)}deg`,
                '--d': `${Math.round(alea(k + 0.5) * 46)}ms`,
                '--sh': (alea(k + 0.25) * 0.14).toFixed(3),
                '--hi': (alea(k + 0.75) * 0.07).toFixed(3),
              } as CSSProperties
            }
          />
        )
      })}
      <span className="doors__rod" />
    </>
  )
}

function Battant({ cote }: { cote: 'l' | 'r' }) {
  const graine = cote === 'l' ? 11 : 47
  const retard = cote === 'l' ? 0 : 130
  return (
    <div className={`doors__leaf doors__leaf--${cote}`}>
      <div className="doors__louvers">
        <div className="doors__panel doors__panel--haut" style={{ '--pd': `${retard}ms` } as CSSProperties}>
          <Lames n={HAUT} depuis={0} graine={graine} />
        </div>
        <div className="doors__panel doors__panel--bas" style={{ '--pd': `${retard + 170}ms` } as CSSProperties}>
          <Lames n={BAS} depuis={HAUT} graine={graine} />
        </div>
      </div>
      <div className="doors__carcass">
        <span className="doors__stile doors__stile--hinge" />
        <span className="doors__stile doors__stile--meet" />
        <span className="doors__rail doors__rail--top" />
        <span className="doors__bead doors__bead--haut" />
        <span className="doors__rail doors__rail--lock" />
        <span className="doors__bead doors__bead--bas" />
        <span className="doors__rail doors__rail--frieze" />
        <span className="doors__raised" />
        <span className="doors__rail doors__rail--bottom" />
      </div>
      <div className="doors__hardware">
        <span className="doors__plate" />
        <span className="doors__lever" />
      </div>
      {cote === 'r' && <span className="doors__astragal" />}
      <span className="doors__shade" />
    </div>
  )
}

/** Dormant, imposte vitrée en fer forgé, charnières et battants d’une baie. */
function Menuiserie() {
  return (
    <>
      <div className="doors__leaves">
        <Battant cote="l" />
        <Battant cote="r" />
      </div>
      <div className="doors__dormant">
        <span className="doors__head" />
        <span className="doors__transom">
          <span className="doors__transom-sun" />
        </span>
        <span className="doors__bar" />
        <span className="doors__jamb doors__jamb--l" />
        <span className="doors__jamb doors__jamb--r" />
        <span className="doors__threshold" />
        {CHARNIERES.map(y => (
          <span key={`l${y}`} className="doors__hinge doors__hinge--l" style={{ '--y': y } as CSSProperties} />
        ))}
        {CHARNIERES.map(y => (
          <span key={`r${y}`} className="doors__hinge doors__hinge--r" style={{ '--y': y } as CSSProperties} />
        ))}
      </div>
      <span className="doors__cast" />
    </>
  )
}

function BaieVoisine({ cote }: { cote: 'l' | 'r' }) {
  return (
    <div className={`doors__bay doors__bay--flat doors__bay--${cote}`}>
      <span className="doors__surround" />
      <span className="doors__recess-flat" />
      <div className="doors__recess">
        <Menuiserie />
      </div>
    </div>
  )
}

function Lanterne({ cote }: { cote: 'l' | 'r' }) {
  return (
    <span className={`doors__lantern doors__lantern--${cote}`}>
      <span className="doors__lantern-glow" />
    </span>
  )
}

type Sign = { main: string; script: string; small: string }

type Props = {
  sign: Sign
  className?: string
  style?: CSSProperties
}

export const Doors = forwardRef<HTMLDivElement, Props>(function Doors({ sign, className = '', style }, ref) {
  return (
    <div ref={ref} className={`doors ${className}`} style={style} aria-hidden>
      <div className="doors__stage">
        <div className="doors__scene">
          <div className="doors__wall">
            <span className="doors__plinth" />
            <BaieVoisine cote="l" />
            <BaieVoisine cote="r" />
            <span className="doors__surround doors__surround--main" />
            <span className="doors__step doors__step--1" />
            <span className="doors__step doors__step--2" />
            <span className="doors__plaque">
              <small>Rue</small>
              {MAISON.rue.replace(/^Rue\s+/i, '')}
            </span>
            <Lanterne cote="l" />
            <Lanterne cote="r" />
            <div className="doors__sign" style={{ '--chars': sign.main.length } as CSSProperties}>
              <div className="doors__paint">
                <span className="sign__main">{sign.main}</span>
                <span className="sign__script">{sign.script}</span>
                <span className="sign__small">{sign.small}</span>
              </div>
            </div>
          </div>
          <div className="doors__bay doors__bay--live">
            <span className="doors__reveal doors__reveal--t" />
            <span className="doors__reveal doors__reveal--b" />
            <span className="doors__reveal doors__reveal--l" />
            <span className="doors__reveal doors__reveal--r" />
            <div className="doors__recess">
              <span className="doors__interior" />
              <Menuiserie />
            </div>
          </div>
          <div className="doors__palms">
            <div className="doors__palms-sway" />
          </div>
        </div>
        <span className="doors__vignette" />
      </div>
    </div>
  )
})
