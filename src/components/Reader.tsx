// Le lecteur des carnets : une feuille qui glisse depuis la droite.
import { motion } from 'motion/react'
import { Dialog } from './Dialog'
import { Picture } from './Picture'
import { Close, Arrow } from './Icons'
import { CARNETS } from '../content/journal'
import { useRoute } from '../state/route'
import { SHEET, reducedMotion } from '../lib/motion'

export function Reader({ no }: { no: string }) {
  const { close, swap } = useRoute()
  const i = Math.max(0, CARNETS.findIndex(c => c.no === no))
  const c = CARNETS[i]
  const next = CARNETS[(i + 1) % CARNETS.length]
  const reduce = reducedMotion()
  return (
    <Dialog label={c.titre} onClose={close} className="ov ov--reader">
      <motion.div className="ov__scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      <motion.article
        key={c.no}
        className="reader"
        initial={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
        transition={SHEET}
      >
        <div className="reader__top">
          <p className="label">
            Carnet n° {c.no} · {c.genre} · {c.lecture}
          </p>
          <button type="button" className="icon-btn press" onClick={close} aria-label="Fermer le carnet" data-autofocus>
            <Close />
          </button>
        </div>
        <header className="reader__head">
          <h2 className="reader__title">{c.titre}</h2>
          <p className="reader__dek lead">{c.dek}</p>
          <p className="label">{c.date}</p>
        </header>
        <figure className="reader__figure">
          <Picture slug={c.image} alt="" sizes="(max-width: 760px) 100vw, 680px" position={c.position} ratio={false} />
          <figcaption className="label">{c.legende}</figcaption>
        </figure>
        <div className="reader__body">
          {c.corps.map((b, k) => (
            <div key={k} className={b.q ? 'reader__qa' : undefined}>
              {b.q && <p className="reader__q">{b.q}</p>}
              <p>{b.p}</p>
            </div>
          ))}
          <span className="reader__end" aria-hidden />
        </div>
        <button type="button" className="reader__next press" onClick={() => swap({ kind: 'carnet', no: next.no })}>
          <span className="label">Carnet suivant · n° {next.no}</span>
          <span className="reader__next-title">{next.titre}</span>
          <Arrow />
        </button>
      </motion.article>
    </Dialog>
  )
}
