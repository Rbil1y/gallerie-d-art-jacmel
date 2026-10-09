// La salle d’une œuvre : décrochée du mur, posée sur un mur à sa couleur.
// Trois regards : au mur, à l’échelle, en lumière rasante.
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Dialog } from './Dialog'
import { Picture } from './Picture'
import { TrueScale } from './TrueScale'
import { DotToggle, Dot } from './RedDot'
import { Close, ArrowLeft, Arrow, Link as LinkIcon, Check } from './Icons'
import { ARTWORKS, SALLES, oeuvre, relief, type Artwork } from '../content/artworks'
import { image } from '../content/images'
import { useRoute } from '../state/route'
import { useSelection } from '../state/selection'
import { useScrollApi } from '../state/scroll'
import { viewerOrigin, layoutIdFor } from '../state/viewerOrigin'
import { dimensions, prix, numero } from '../lib/fr'
import { SPRING, FLICK, reducedMotion } from '../lib/motion'

const RakingLight = lazy(() => import('./RakingLight'))

type Mode = 'mur' | 'echelle' | 'rasante'
const MODES: { id: Mode; label: string }[] = [
  { id: 'mur', label: 'Au mur' },
  { id: 'echelle', label: 'À l’échelle' },
  { id: 'rasante', label: 'Lumière rasante' },
]

function WallView({ a, layoutId }: { a: Artwork; layoutId?: string }) {
  const m = image(a.image)
  return (
    <div className="viewer__wall" style={{ '--ratio': m.ratio } as CSSProperties}>
      <motion.div className="viewer__frame" layoutId={layoutId} transition={SPRING}>
        <Picture slug={a.image} alt={`${a.titre}, ${a.artiste}, ${a.annee}`} sizes="(max-width: 900px) 92vw, 62vw" fit="contain" priority />
      </motion.div>
    </div>
  )
}

export function Viewer({ id }: { id: string }) {
  const a = oeuvre(id) ?? ARTWORKS[0]
  const { close, swap } = useRoute()
  const { has, toggle } = useSelection()
  const { scrollTo } = useScrollApi()
  const [mode, setMode] = useState<Mode>('mur')
  const [dir, setDir] = useState(0)
  const [copied, setCopied] = useState(false)
  const [origin] = useState(() => ({ ...viewerOrigin }))
  const idx = ARTWORKS.indexOf(a)
  const n = ARTWORKS.length
  const prev = ARTWORKS[(idx - 1 + n) % n]
  const next = ARTWORKS[(idx + 1) % n]
  const salle = SALLES.find(s => s.no === a.salle)!
  const wall = image(a.image).color
  const stage = useRef<HTMLDivElement>(null)
  const effectiveMode: Mode = mode === 'rasante' && !relief(a) ? 'mur' : mode

  const goTo = (target: Artwork, d: number) => {
    setDir(d)
    swap({ kind: 'oeuvre', id: target.id })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (t instanceof Element && t.closest('input, textarea, [role="slider"]')) return
      if (e.key === 'ArrowRight') goTo(next, 1)
      if (e.key === 'ArrowLeft') goTo(prev, -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // balayage horizontal (désactivé en lumière rasante : le doigt y porte la lampe)
  const drag = useRef<{ x: number; y: number; t: number; axis: 'x' | 'y' | null } | null>(null)
  const [dx, setDx] = useState(0)
  const onDown = (e: React.PointerEvent) => {
    if (effectiveMode === 'rasante' || e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), axis: null }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (!d.axis && Math.hypot(mx, my) > 10) d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'
    if (d.axis === 'x') setDx(mx)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || d.axis !== 'x') return setDx(0)
    const mx = e.clientX - d.x
    const v = mx / Math.max(1, performance.now() - d.t)
    setDx(0)
    if (mx < -70 || v < -0.45) goTo(next, 1)
    else if (mx > 70 || v > 0.45) goTo(prev, -1)
  }

  const demander = () => {
    if (!has(a.id)) toggle(a.id)
    close()
    setTimeout(() => {
      scrollTo('#comptoir')
      setTimeout(() => document.getElementById('f-message')?.focus({ preventScroll: true }), 900)
    }, 380)
  }

  const copier = () => {
    const url = `${location.origin}${location.pathname}#oeuvre-${a.id}`
    Promise.resolve(navigator.clipboard?.writeText(url))
      .catch(() => undefined)
      .finally(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      })
  }

  const reduce = reducedMotion()
  const layoutId = origin.id === a.id && origin.source ? layoutIdFor(a.id, origin.source) : undefined

  return (
    <Dialog label={`${a.titre}, ${a.artiste}`} onClose={close} className="ov ov--viewer">
      <motion.div
        className="viewer"
        style={{ '--wall-art': wall } as CSSProperties}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.2 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div
          ref={stage}
          className={`viewer__stage is-${effectiveMode}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => {
            drag.current = null
            setDx(0)
          }}
        >
          <div className="viewer__modes" role="group" aria-label="Façon de regarder">
            {MODES.map(m => {
              const disabled = m.id === 'rasante' && !relief(a)
              return (
                <button
                  key={m.id}
                  type="button"
                  className="viewer__mode ui press"
                  aria-pressed={effectiveMode === m.id}
                  disabled={disabled}
                  title={disabled ? 'Un tirage photographique est plat : rien à révéler en lumière rasante.' : undefined}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={`${a.id}-${effectiveMode}`}
              className="viewer__scene"
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 60 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -60 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={dir ? FLICK : SPRING}
              style={{ translateX: dx * 0.9 }}
            >
              {effectiveMode === 'mur' && <WallView a={a} layoutId={layoutId} />}
              {effectiveMode === 'echelle' && <TrueScale a={a} />}
              {effectiveMode === 'rasante' && (
                <Suspense fallback={<WallView a={a} />}>
                  <RakingLight a={a} />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="viewer__nav">
            <button type="button" className="icon-btn icon-btn--stage press" onClick={() => goTo(prev, -1)} aria-label={`Œuvre précédente : ${prev.titre}`}>
              <ArrowLeft />
            </button>
            <span className="viewer__count ui">
              {idx + 1} / {n}
            </span>
            <button type="button" className="icon-btn icon-btn--stage press" onClick={() => goTo(next, 1)} aria-label={`Œuvre suivante : ${next.titre}`}>
              <Arrow />
            </button>
          </div>
        </div>

        <motion.aside
          className="viewer__panel"
          initial={{ x: reduce ? 0 : 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: reduce ? 0 : 40, opacity: 0 }}
          transition={{ ...SPRING, delay: 0.08 }}
        >
          <div className="viewer__top">
            <p className="label">
              {numero(a.id)} · Salle {salle.no} — {salle.nom}
            </p>
            <button type="button" className="icon-btn press" onClick={close} aria-label="Fermer et revenir au mur" data-autofocus>
              <Close />
            </button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={a.id} className="viewer__cartel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}>
              <p className="viewer__artist">{a.artiste}</p>
              <h2 className="viewer__title">
                <i>{a.titre}</i>
              </h2>
              <p className="viewer__year ui muted">{a.annee}</p>
              <dl className="viewer__facts ui">
                <div>
                  <dt>Technique</dt>
                  <dd>{a.medium}</dd>
                </div>
                <div>
                  <dt>Dimensions</dt>
                  <dd>{dimensions(a.hCm, a.lCm)}</dd>
                </div>
                <div>
                  <dt>Provenance</dt>
                  <dd>Atelier, Jacmel</dd>
                </div>
              </dl>
              <blockquote className="viewer__prov">{a.provenance}</blockquote>
              <p className={`viewer__price ${a.statut === 'réservée' ? 'is-reserved' : ''}`}>
                {a.statut === 'réservée' ? (
                  <>
                    <Dot /> Réservée <span className="ui muted">· liste d’attente ouverte</span>
                  </>
                ) : (
                  <>
                    {prix(a.prix)} <span className="ui muted">· certificat compris</span>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="viewer__actions">
            <DotToggle id={a.id} titre={a.titre} />
            <button type="button" className="btn" onClick={demander}>
              Demander cette œuvre <Arrow />
            </button>
            <button type="button" className="viewer__share ui press" onClick={copier}>
              {copied ? <Check /> : <LinkIcon />} {copied ? 'Lien copié' : 'Copier le lien'}
            </button>
          </div>
          <p className="viewer__hint label">Flèches du clavier : œuvre voisine · Échap : retour au mur</p>
        </motion.aside>
      </motion.div>
    </Dialog>
  )
}
