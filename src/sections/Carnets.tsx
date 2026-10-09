// Les carnets : ce qui se passe avant l’accrochage. Chaque entrée s’ouvre dans le lecteur.
import { CARNETS } from '../content/journal'
import { Picture } from '../components/Picture'
import { SlatReveal } from '../components/SlatReveal'
import { Arrow } from '../components/Icons'
import { useRoute } from '../state/route'

export function Carnets() {
  const { open } = useRoute()
  const [une, ...suite] = CARNETS
  return (
    <section id="carnets" data-room="carnets" className="carnets" aria-labelledby="carnets-titre">
      <header className="sec-head wrap">
        <p className="label">Carnets d’atelier</p>
        <SlatReveal as="h2" id="carnets-titre" className="h2" pitch="0.2em">
          Ce qui se passe <i>avant l’accrochage.</i>
        </SlatReveal>
      </header>
      <div className="carnets__grid wrap">
        <article className="carnet-une">
          <button type="button" className="carnet-une__hit" onClick={() => open({ kind: 'carnet', no: une.no })}>
            <span className="carnet-une__media">
              <Picture slug={une.image} alt="" sizes="(max-width: 760px) 92vw, 56vw" position={une.position} ratio={false} />
            </span>
            <span className="carnet-une__text">
              <span className="label">
                n° {une.no} · {une.genre} · {une.lecture}
              </span>
              <span className="carnet-une__title">{une.titre}</span>
              <span className="carnet-une__dek">{une.dek}</span>
              <span className="arrow-link">
                Lire le carnet <Arrow size={16} />
              </span>
            </span>
          </button>
        </article>
        <ol className="carnets__list">
          {suite.map(c => (
            <li key={c.no}>
              <button type="button" className="carnet-row" onClick={() => open({ kind: 'carnet', no: c.no })}>
                <span className="carnet-row__no label">n° {c.no}</span>
                <span className="carnet-row__media">
                  <Picture slug={c.image} alt="" sizes="160px" position={c.position} ratio={false} />
                </span>
                <span className="carnet-row__text">
                  <span className="carnet-row__title">{c.titre}</span>
                  <span className="carnet-row__dek">{c.dek}</span>
                  <span className="label">
                    {c.genre} · {c.lecture} · {c.date}
                  </span>
                </span>
                <Arrow className="carnet-row__arrow" />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
