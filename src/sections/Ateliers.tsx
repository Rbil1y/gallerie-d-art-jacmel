// Les ateliers : trois maisons associées, montrées par ce qu’elles regardent — pas par leurs visages.
import { ARTISTES } from '../content/artists'
import { ARTWORKS } from '../content/artworks'
import { Picture } from '../components/Picture'
import { SlatReveal } from '../components/SlatReveal'
import { Arrow } from '../components/Icons'
import { useExpo } from '../state/expo'
import { useOpenArtwork, layoutIdFor } from '../state/viewerOrigin'
import { motion } from 'motion/react'
import { pluriel } from '../lib/fr'

export function Ateliers() {
  const { allerAuRegistre } = useExpo()
  const openArtwork = useOpenArtwork()
  return (
    <section id="ateliers" data-room="ateliers" className="ateliers" aria-labelledby="ateliers-titre">
      <header className="sec-head wrap">
        <p className="label">Les ateliers associés</p>
        <SlatReveal as="h2" id="ateliers-titre" className="h2" pitch="0.2em">
          Ce qu’ils <i>regardent.</i>
        </SlatReveal>
        <p className="lead muted sec-head__lede">Plutôt que leurs visages, nous montrons ce qui les occupe depuis des années. Le reste est dans les œuvres.</p>
      </header>
      <div className="ateliers__list">
        {ARTISTES.map((ar, i) => {
          const works = ARTWORKS.filter(a => a.artiste === ar.nom)
          return (
            <article key={ar.id} className={`atelier wrap ${i % 2 ? 'atelier--flip' : ''}`} aria-labelledby={`atelier-${ar.id}`}>
              <figure className="atelier__motif">
                <Picture slug={ar.motif.image} alt="" sizes="(max-width: 760px) 92vw, 52vw" position={ar.motif.position} />
                <figcaption className="label">{ar.motif.legende}</figcaption>
              </figure>
              <div className="atelier__text">
                <p className="label">
                  {ar.discipline} · depuis {ar.depuis}
                </p>
                <h3 id={`atelier-${ar.id}`} className="atelier__name">
                  {ar.nom}
                </h3>
                {ar.bio.map((p, k) => (
                  <p key={k} className="atelier__bio">
                    {p}
                  </p>
                ))}
                <p className="atelier__count ui">
                  {pluriel(ar.registre, 'pièce')} au registre depuis {ar.depuis} · {pluriel(works.length, 'accrochée')} aujourd’hui
                </p>
                <div className="atelier__works">
                  {works.map(a => (
                    <button key={a.id} type="button" className="atelier__work press" onClick={() => openArtwork(a.id, `atelier-${ar.id}`)} aria-label={`Regarder « ${a.titre} »`}>
                      <motion.span className="atelier__work-frame" layoutId={layoutIdFor(a.id, `atelier-${ar.id}`)} style={{ aspectRatio: `${a.lCm} / ${a.hCm}` }}>
                        <Picture slug={a.image} alt="" sizes="120px" fit="contain" />
                      </motion.span>
                      <span className="atelier__work-title ui">
                        <i>{a.titre}</i>
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" className="arrow-link" onClick={() => allerAuRegistre({ artiste: ar.nom })}>
                  Ses œuvres dans la liste des prix <Arrow size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
