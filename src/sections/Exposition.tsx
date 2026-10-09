// L’exposition « Terre / Mer » : la promenade (accrochage) ou la liste des prix (registre).
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ARTWORKS, SALLES, TECHNIQUES, parSalle, type Artwork } from '../content/artworks'
import { EXPO } from '../content/site'
import { Hung } from '../components/Hung'
import { Picture } from '../components/Picture'
import { SlatReveal } from '../components/SlatReveal'
import { DotToggle, Dot } from '../components/RedDot'
import { Arrow, Close } from '../components/Icons'
import { useExpo, type Tri } from '../state/expo'
import { useLight } from '../state/light'
import { useGo } from '../state/navigate'
import { useScrollApi } from '../state/scroll'
import { useOpenArtwork, layoutIdFor } from '../state/viewerOrigin'
import { dimensions, prix, numero, pluriel } from '../lib/fr'
import { finePointer, SETTLE } from '../lib/motion'

export function Exposition() {
  const { mode, setMode } = useExpo()
  const reserved = ARTWORKS.filter(a => a.statut === 'réservée').length
  return (
    <section id="exposition" className="expo" aria-labelledby="expo-titre">
      <header className="expo__head wrap" data-room={mode === 'registre' ? 'registre' : 'salle-1'}>
        <p className="label">L’exposition · {EXPO.dates}</p>
        <SlatReveal as="h2" id="expo-titre" className="h2 expo__title" pitch="0.2em">
          Huit pièces, <i>une seule ligne.</i>
        </SlatReveal>
        <div className="expo__intro">
          <p className="lead">{EXPO.texte}</p>
          <p className="ui muted">
            {pluriel(ARTWORKS.length, 'œuvre')} · {pluriel(reserved, 'réservée')} · posez un point rouge sur celles qui vous retiennent.
          </p>
        </div>
        <div className="seg ui" role="group" aria-label="Façon de parcourir l’exposition">
          <button type="button" className="press" aria-pressed={mode === 'accrochage'} onClick={() => setMode('accrochage')}>
            Accrochage
          </button>
          <button type="button" className="press" aria-pressed={mode === 'registre'} onClick={() => setMode('registre')}>
            Liste des prix
          </button>
        </div>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'accrochage' ? (
          <motion.div key="walk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.32, ease: SETTLE }}>
            <Walk />
          </motion.div>
        ) : (
          <motion.div key="registre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.32, ease: SETTLE }}>
            <Registre />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Accrochage : quatre salles, un mur chacune, œuvres à l’échelle réelle */

function Walk() {
  const ref = useRef<HTMLDivElement>(null)
  const lamp = useRef<HTMLDivElement>(null)
  const { night } = useLight()
  const { allerAuRegistre } = useExpo()
  const go = useGo()
  const [current, setCurrent] = useState<string>(ARTWORKS[0].id)

  // œuvre la plus proche du milieu de l’écran → la ligne d’accrochage
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setCurrent((e.target as HTMLElement).dataset.id!)
      },
      { rootMargin: '-46% 0px -46% 0px' },
    )
    el.querySelectorAll('.hung[data-id]').forEach(h => io.observe(h))
    return () => io.disconnect()
  }, [])

  // la nuit, une lampe suit le pointeur sur les murs
  useEffect(() => {
    const el = ref.current
    if (!el || !night || !finePointer()) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        lamp.current?.style.setProperty('transform', `translate3d(${e.clientX - r.left - 300}px, ${e.clientY - r.top - 300}px, 0)`)
        el.classList.add('has-lamp')
      })
    }
    const onLeave = () => el.classList.remove('has-lamp')
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.classList.remove('has-lamp')
    }
  }, [night])

  return (
    <div className="walk" ref={ref}>
      <div className="walk__lamp" ref={lamp} aria-hidden />
      <HangingLine current={current} />
      {SALLES.map(s => (
        <section key={s.no} id={`salle-${s.no}`} data-room={`salle-${s.no}`} className={`wall wall--${s.no}`} aria-labelledby={`salle-${s.no}-nom`}>
          <div className="wall__text wrap">
            <p className="label">
              Salle {s.no}
              {s.cote && <> · côté {s.cote.toLowerCase()}</>}
            </p>
            <h3 id={`salle-${s.no}-nom`} className="wall__name">
              {s.nom}
            </h3>
            <p className="wall__copy">{s.texte}</p>
            {s.document && (
              <figure className="wall__doc">
                <Picture slug={s.document.image} alt="" sizes="160px" />
                <figcaption className="label">{s.document.legende}</figcaption>
              </figure>
            )}
          </div>
          <div className="wall__hang wrap">
            {parSalle(s.no).map(a => (
              <Hung key={a.id} a={a} source="walk" sizes="(max-width: 760px) 80vw, 40vw" />
            ))}
          </div>
        </section>
      ))}
      <div className="walk__end wrap">
        <p className="label">Fin de l’accrochage</p>
        <p className="walk__end-title">
          Vous voici <i>à la mer.</i>
        </p>
        <div className="walk__end-actions">
          <button type="button" className="btn" onClick={() => allerAuRegistre()}>
            Voir la liste des prix <Arrow />
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
    </div>
  )
}

/** La ligne d’accrochage : les huit œuvres, de la terre à la mer. */
function HangingLine({ current }: { current: string }) {
  const { scrollTo } = useScrollApi()
  const go = (id: string) => scrollTo(`#piece-${id}`, { offset: -Math.round(window.innerHeight * 0.24) })
  return (
    <nav className="hline" aria-label="Ligne d’accrochage, de la terre à la mer">
      <div className="hline__inner wrap">
        <span className="hline__end label">Terre</span>
        <ol className="hline__rooms">
          {SALLES.map(s => (
            <li key={s.no} className="hline__room">
              <span className="hline__room-name label">
                {s.no} · {s.nom}
              </span>
              <span className="hline__ticks">
                {parSalle(s.no).map(a => (
                  <button
                    key={a.id}
                    type="button"
                    className={`hline__tick ${a.id === current ? 'is-current' : ''} ${a.statut === 'réservée' ? 'is-reserved' : ''}`}
                    aria-current={a.id === current ? 'true' : undefined}
                    aria-label={`${a.titre}, salle ${s.no}`}
                    title={a.titre}
                    onClick={() => go(a.id)}
                  />
                ))}
              </span>
            </li>
          ))}
        </ol>
        <span className="hline__end label">Mer</span>
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Liste des prix : le registre                                         */

const TECH_LABEL: Record<string, string> = {
  tout: 'Tout',
  peinture: 'Peinture',
  sculpture: 'Sculpture',
  'papier-mâché': 'Papier-mâché',
  photographie: 'Photographie',
}

function SortButton({ cle, children }: { cle: Tri['cle']; children: string }) {
  const { tri, setTri } = useExpo()
  const active = tri.cle === cle
  return (
    <button
      type="button"
      className={`ledger__sort ${active ? 'is-active' : ''}`}
      onClick={() => setTri({ cle, sens: active ? (tri.sens === 1 ? -1 : 1) : 1 })}
    >
      {children}
      <span className="ledger__sort-mark" aria-hidden data-dir={active ? tri.sens : 0} />
    </button>
  )
}

function Registre() {
  const { filtres, setFiltres, tri } = useExpo()
  const openArtwork = useOpenArtwork()

  const rows = useMemo(() => {
    const list = ARTWORKS.filter(
      a =>
        (filtres.technique === 'tout' || a.technique === filtres.technique) &&
        (!filtres.disponibles || a.statut === 'disponible') &&
        (!filtres.artiste || a.artiste === filtres.artiste),
    )
    const key = (a: Artwork) => (tri.cle === 'id' ? Number(a.id) : tri.cle === 'prix' ? a.prix : a.annee)
    return [...list].sort((x, y) => (key(x) - key(y)) * tri.sens)
  }, [filtres, tri])

  const ariaSort = (cle: Tri['cle']) => (tri.cle === cle ? (tri.sens === 1 ? 'ascending' : 'descending') : 'none')
  const total = rows.filter(a => a.statut === 'disponible').reduce((s, a) => s + a.prix, 0)

  return (
    <div id="registre" data-room="registre" className="registre wrap">
      <div className="registre__tools">
        <div className="chips" role="group" aria-label="Filtrer par technique">
          {(['tout', ...TECHNIQUES] as const).map(t => (
            <button key={t} type="button" className="chip ui press" aria-pressed={filtres.technique === t} onClick={() => setFiltres({ technique: t })}>
              {TECH_LABEL[t]}
            </button>
          ))}
        </div>
        <label className="switch ui">
          <input type="checkbox" checked={filtres.disponibles} onChange={e => setFiltres({ disponibles: e.target.checked })} />
          <span className="switch__track" aria-hidden />
          Disponibles seulement
        </label>
        {filtres.artiste && (
          <button type="button" className="chip chip--on ui press" onClick={() => setFiltres({ artiste: null })} aria-label={`Retirer le filtre ${filtres.artiste}`}>
            {filtres.artiste} <Close size={14} />
          </button>
        )}
      </div>

      <table className="ledger">
        <caption className="sr-only">Liste des prix de l’exposition Terre / Mer</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('id')}>
              <SortButton cle="id">N°</SortButton>
            </th>
            <th scope="col">Œuvre</th>
            <th scope="col" className="ledger__opt">
              Technique
            </th>
            <th scope="col" className="ledger__opt">
              Dimensions
            </th>
            <th scope="col" aria-sort={ariaSort('annee')}>
              <SortButton cle="annee">Année</SortButton>
            </th>
            <th scope="col" aria-sort={ariaSort('prix')} className="ledger__right">
              <SortButton cle="prix">Prix</SortButton>
            </th>
            <th scope="col">
              <span className="sr-only">Point rouge</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className="ledger__row" onClick={() => openArtwork(a.id, 'registre')}>
              <td className="ledger__no ui">{a.id}</td>
              <td className="ledger__work">
                <span className="ledger__thumb" style={{ '--ratio': a.lCm / a.hCm } as CSSProperties}>
                  <motion.span className="ledger__thumb-frame" layoutId={layoutIdFor(a.id, 'registre')}>
                    <Picture slug={a.image} alt="" sizes="80px" fit="contain" />
                  </motion.span>
                </span>
                <span className="ledger__names">
                  <button
                    type="button"
                    className="ledger__title"
                    onClick={e => {
                      e.stopPropagation()
                      openArtwork(a.id, 'registre')
                    }}
                  >
                    <i>{a.titre}</i>
                  </button>
                  <span className="ledger__artist ui">
                    {a.artiste}
                    <span className="ledger__mobile"> · {numero(a.id)}</span>
                  </span>
                </span>
              </td>
              <td className="ledger__opt ui">{a.medium}</td>
              <td className="ledger__opt ui">{dimensions(a.hCm, a.lCm)}</td>
              <td className="ledger__year ui">{a.annee}</td>
              <td className="ledger__price ledger__right ui">
                {a.statut === 'réservée' ? (
                  <span className="ledger__reserved">
                    <Dot /> Réservée
                  </span>
                ) : (
                  prix(a.prix)
                )}
              </td>
              <td className="ledger__dot">
                <DotToggle id={a.id} titre={a.titre} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <div className="registre__empty">
          <p className="lead">Aucune œuvre ne répond à ces filtres.</p>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setFiltres({ technique: 'tout', disponibles: false, artiste: null })}>
            Tout afficher
          </button>
        </div>
      ) : (
        <p className="registre__note label">
          {pluriel(rows.length, 'œuvre')} · disponibles pour {prix(total)} · prix en dollars américains, certificat d’authenticité compris, expédition possible depuis Jacmel.
        </p>
      )}
    </div>
  )
}
