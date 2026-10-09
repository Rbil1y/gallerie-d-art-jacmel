// La maison : le manifeste, une rue de Jacmel en 1904, les faits en cartel.
import { SlatReveal } from '../components/SlatReveal'
import { Picture } from '../components/Picture'
import { MANIFESTE, FAITS, VILLE_LUMIERE } from '../content/site'

export function Maison() {
  return (
    <section id="maison" data-room="maison" className="maison" aria-labelledby="maison-titre">
      <div className="maison__grid wrap">
        <h2 id="maison-titre" className="maison__kicker label">
          La maison, depuis 1987
        </h2>
        <SlatReveal as="p" className="maison__manifeste" pitch="0.2em">
          {MANIFESTE}
        </SlatReveal>
        <figure className="maison__archive">
          <Picture slug="jacmel-1904" alt="Une rue de Jacmel en 1904 : maisons basses, un homme en chapeau au premier plan." sizes="(max-width: 760px) 90vw, 30vw" />
          <figcaption className="label">Jacmel, une rue, le 20 décembre 1904. Photographie de G. M. Versteeg.</figcaption>
        </figure>
        <dl className="maison__faits">
          {FAITS.map(f => (
            <div key={f.label}>
              <dt className="label">{f.label}</dt>
              <dd>{f.valeur}</dd>
            </div>
          ))}
        </dl>
        <p className="maison__lumiere">
          <span className="lamp" aria-hidden />
          {VILLE_LUMIERE}
        </p>
      </div>
    </section>
  )
}
