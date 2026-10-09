// La fermeture : en arrivant au bout, les battants se referment et l’enseigne dit à quand.
// Puis le colophon : crédits, licences, et qui a fait quoi.
import { useEffect, useRef } from 'react'
import { useScroll, useMotionValueEvent } from 'motion/react'
import { Doors } from '../components/Doors'
import { Daylight } from '../components/Daylight'
import { Logo } from '../components/Header'
import { ArrowUp, ArrowUpRight } from '../components/Icons'
import { useLight } from '../state/light'
import { useScrollApi } from '../state/scroll'
import { CREDITS } from '../content/credits'
import { MAISON } from '../content/site'
import { heureCourte } from '../lib/jacmel'
import { reducedMotion } from '../lib/motion'

const smooth = (a: number, b: number, v: number) => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

export function Fermeture() {
  const track = useRef<HTMLDivElement>(null)
  const doors = useRef<HTMLDivElement>(null)
  const { open } = useLight()
  const { scrollTo } = useScrollApi()
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })

  const apply = (p: number) => {
    const el = doors.current
    if (!el) return
    const shut = smooth(0.04, 0.72, p)
    const louver = 1 - smooth(0.72, 0.94, p)
    el.style.setProperty('--open', (1 - shut).toFixed(4))
    el.style.setProperty('--louver', louver.toFixed(4))
    el.style.setProperty('--sign', smooth(0.45, 0.8, p).toFixed(4))
  }
  useMotionValueEvent(scrollYProgress, 'change', v => {
    if (!reducedMotion()) apply(v)
  })
  useEffect(() => {
    if (reducedMotion()) {
      doors.current?.style.setProperty('--open', '0')
      doors.current?.style.setProperty('--louver', '0')
      doors.current?.style.setProperty('--sign', '1')
    } else apply(scrollYProgress.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const main = open.open ? 'À tout de suite' : `À ${open.next?.quand === 'aujourd’hui' ? 'tout à l’heure' : open.next?.quand ?? 'bientôt'}, ${heureCourte(open.next?.h ?? 10)}`
  const script = open.open ? `la porte reste ouverte jusqu’à ${heureCourte(open.closes ?? 18)}` : 'la maison ferme ses persiennes'

  return (
    <footer id="fermeture" data-room="rue" className="fermeture">
      <div ref={track} className="fermeture__track">
        <div className="fermeture__sticky">
          <div className="fermeture__inside" aria-hidden>
            <Daylight fronds={false} />
            <p className="fermeture__line">Merci d’être passé.</p>
          </div>
          <Doors
            ref={doors}
            className="fermeture__doors"
            sign={
              <>
                <span className="sign__main">{main}</span>
                <span className="sign__script">{script}</span>
                <span className="sign__small">Gallerie d’art · Rue Barranquilla</span>
              </>
            }
          />
          <p className="sr-only">
            {main} — {script}.
          </p>
        </div>
      </div>

      <div className="colophon">
        <div className="colophon__grid wrap">
          <div className="colophon__brand">
            <Logo />
            <p className="ui">
              {MAISON.rue}, {MAISON.ville} — {MAISON.region}
              <br />
              <a className="link" href={`mailto:${MAISON.email}`}>
                {MAISON.email}
              </a>{' '}
              · {MAISON.telephone}
            </p>
            <button type="button" className="btn btn--ghost colophon__top" onClick={() => scrollTo(0)}>
              Rouvrir les persiennes <ArrowUp />
            </button>
          </div>
          <div className="colophon__credits">
            <h2 className="label">Photographies</h2>
            <ul className="ui">
              {CREDITS.map(c => (
                <li key={c.image}>
                  {c.sujet} — {c.auteur},{' '}
                  <a className="link" href={c.licenceUrl} target="_blank" rel="noreferrer license">
                    {c.licence}
                  </a>
                  ,{' '}
                  <a className="link" href={c.source} target="_blank" rel="noreferrer">
                    Wikimedia Commons
                  </a>
                </li>
              ))}
            </ul>
            <p className="ui muted">
              Images recadrées et compressées pour le web ; les adaptations restent sous la même licence. Œuvres reproduites : visuels provisoires.
            </p>
          </div>
          <div className="colophon__meta">
            <h2 className="label">Typographies</h2>
            <p className="ui">Newsreader (Production Type), Hanken Grotesk (Alfredo Marco Pradil), Besley (Owen Earl) — SIL Open Font License.</p>
            <h2 className="label">Lumière</h2>
            <p className="ui">La lumière du site suit le soleil réel au-dessus de Jacmel (18,23° N, 72,53° O).</p>
            <p className="ui colophon__made">
              © 2026 {MAISON.nom} ·{' '}
              <a className="link" href="https://aylab.co" target="_blank" rel="noreferrer">
                Conception &amp; développement — Aylab.co <ArrowUpRight size={12} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
