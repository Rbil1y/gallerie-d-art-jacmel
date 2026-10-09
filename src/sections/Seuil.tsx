// Le seuil : le mur blanc, la lumière du moment, le titre de l’exposition en lettres posées.
import { Daylight } from '../components/Daylight'
import { SlatReveal } from '../components/SlatReveal'
import { Hung } from '../components/Hung'
import { Cadran } from '../components/Cadran'
import { ArrowDown, Arrow } from '../components/Icons'
import { EXPO } from '../content/site'
import { oeuvre } from '../content/artworks'
import { useLight } from '../state/light'
import { useGo } from '../state/navigate'
import { heure, etatExposition } from '../lib/jacmel'

export function Seuil({ entered }: { entered: boolean }) {
  const light = useLight()
  const go = useGo()
  const baie = oeuvre('001')!
  const etat = etatExposition(light.now, EXPO.debut, EXPO.fin)
  const kicker = etat === 'à venir' ? 'Exposition à venir · vernissage le 12 octobre' : etat === 'en cours' ? 'Exposition en cours' : 'Exposition passée'

  return (
    <section id="seuil" data-room="seuil" className={`seuil ${entered ? 'is-entered' : ''}`} aria-labelledby="seuil-titre">
      <Daylight />
      <div className="seuil__grid wrap">
        <div className="seuil__text">
          <p className="seuil__kicker label">{kicker}</p>
          <h1 id="seuil-titre" className="seuil__title display">
            <span className="sr-only">Terre / Mer — exposition à la Gallerie d’art de Jacmel</span>
            <SlatReveal as="span" className="seuil__word" ready={entered} pitch="0.16em" aria-hidden>
              Terre
            </SlatReveal>
            <span className="seuil__slash" aria-hidden />
            <SlatReveal as="span" className="seuil__word seuil__word--mer" ready={entered} pitch="0.16em" delay={0.14} aria-hidden>
              <i>Mer</i>
            </SlatReveal>
          </h1>
          <p className="seuil__dek lead">{EXPO.dek}</p>
          <p className="seuil__dates ui">
            {EXPO.dates}
            <span aria-hidden> · </span>
            <span>Rue Barranquilla, Jacmel</span>
          </p>
          <div className="seuil__ctas">
            <button type="button" className="btn" onClick={() => go('salle-1')}>
              Entrer dans l’exposition <ArrowDown />
            </button>
            <a
              className="arrow-link"
              href="#comptoir"
              onClick={e => {
                e.preventDefault()
                go('comptoir')
              }}
            >
              Préparer sa visite <Arrow size={16} />
            </a>
          </div>
        </div>
        <div className="seuil__work">
          <Hung a={baie} source="seuil" sizes="(max-width: 760px) 78vw, 34vw" priority hero cartel={false} />
          <p className="seuil__cartel ui">
            <span>{baie.artiste}</span>
            <span>
              <i>{baie.titre}</i>, {baie.annee}
            </span>
          </p>
        </div>
      </div>
      <div className="seuil__foot wrap">
        <p className="seuil__now ui" aria-live="off">
          Il est <b>{heure(light.t)}</b> à Jacmel — {light.ambiance}.{' '}
          <span className={`seuil__open ${light.open.open ? 'is-open' : ''}`}>
            <span className="lamp" aria-hidden /> {light.open.label}
          </span>
        </p>
        <Cadran className="seuil__cadran" />
      </div>
    </section>
  )
}
