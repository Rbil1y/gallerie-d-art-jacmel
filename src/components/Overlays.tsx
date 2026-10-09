// Le plan en grand, et le tiroir de la sélection.
import { motion } from 'motion/react'
import { Dialog } from './Dialog'
import { PlanSvg, PLAN_ROOMS, ROOM_NAMES } from './Plan'
import { Cadran } from './Cadran'
import { Picture } from './Picture'
import { Close, Arrow } from './Icons'
import { Dot } from './RedDot'
import { useRoute } from '../state/route'
import { useScrollApi, type Room } from '../state/scroll'
import { useGo } from '../state/navigate'
import { useSelection } from '../state/selection'
import { useLight } from '../state/light'
import { oeuvre } from '../content/artworks'
import { MAISON } from '../content/site'
import { prix, numero, pluriel } from '../lib/fr'
import { LIGNES_HORAIRES, ligneDuJour } from '../lib/jacmel'
import { SHEET, SETTLE } from '../lib/motion'
import { useMedia } from '../lib/useMedia'

const ORDER: Room[] = ['seuil', 'maison', 'salle-1', 'salle-2', 'salle-3', 'salle-4', 'registre', 'ateliers', 'carnets', 'comptoir']

export function PlanOverlay() {
  const { close } = useRoute()
  const { room } = useScrollApi()
  const go = useGo()
  const light = useLight()
  const today = ligneDuJour(light.now)

  const select = (id: Room) => {
    close()
    setTimeout(() => go(id), 380)
  }

  return (
    <Dialog label="Plan de la maison" onClose={close} className="ov ov--plan">
      <motion.div className="ov__scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      <motion.div
        className="plan-ov"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        animate={{ clipPath: 'inset(0 0 0% 0)' }}
        exit={{ clipPath: 'inset(0 0 100% 0)' }}
        transition={{ duration: 0.62, ease: SETTLE }}
      >
        <div className="plan-ov__top">
          <p className="label">Plan de la maison — {ROOM_NAMES[room]}</p>
          <button type="button" className="icon-btn press" onClick={close} aria-label="Fermer le plan" data-autofocus>
            <Close />
          </button>
        </div>
        <div className="plan-ov__body">
          <div className="plan-ov__drawing">
            <PlanSvg room={room} onSelect={select} title="Plan de la maison, rue Barranquilla" />
            <p className="plan-ov__hint label">Touchez une pièce pour vous y rendre. Le point rouge, c’est vous.</p>
          </div>
          <div className="plan-ov__side">
            <ol className="plan-ov__list">
              {ORDER.map(id => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`plan-ov__link ${room === id ? 'is-here' : ''}`}
                    aria-current={room === id ? 'location' : undefined}
                    onClick={e => {
                      e.preventDefault()
                      select(id)
                    }}
                  >
                    <span>{ROOM_NAMES[id]}</span>
                    {room === id ? <Dot /> : <Arrow size={16} />}
                  </a>
                </li>
              ))}
            </ol>
            <div className="plan-ov__info">
              <div>
                <p className="label">Aujourd’hui</p>
                <p className={`plan-ov__open ui ${light.open.open ? 'is-open' : ''}`}>
                  <span className="lamp" aria-hidden /> {light.open.label}
                </p>
                <p className="ui muted">{LIGNES_HORAIRES[today]?.heures}</p>
              </div>
              <div>
                <p className="label">Adresse</p>
                <p className="ui">
                  {MAISON.rue}, {MAISON.ville}
                </p>
                <a className="ui link" href={`mailto:${MAISON.email}`}>
                  {MAISON.email}
                </a>
              </div>
              <Cadran size={92} />
            </div>
          </div>
        </div>
        <span className="sr-only">{PLAN_ROOMS.length} pièces</span>
      </motion.div>
    </Dialog>
  )
}

export function SelectionDrawer() {
  const { close } = useRoute()
  const { ids, remove } = useSelection()
  const { scrollTo } = useScrollApi()
  const items = ids.map(oeuvre).filter(Boolean) as NonNullable<ReturnType<typeof oeuvre>>[]
  const total = items.reduce((s, a) => s + a.prix, 0)
  const phone = useMedia('(max-width: 760px)')
  const hidden = phone ? { y: '104%' } : { x: '104%' }

  const demander = () => {
    close()
    setTimeout(() => {
      scrollTo('#comptoir')
      setTimeout(() => document.getElementById('f-message')?.focus({ preventScroll: true }), 900)
    }, 380)
  }

  return (
    <Dialog label="Ma sélection" onClose={close} className="ov ov--drawer">
      <motion.div className="ov__scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      <motion.aside className="drawer" initial={hidden} animate={{ x: 0, y: 0 }} exit={hidden} transition={SHEET}>
        <div className="drawer__top">
          <div>
            <p className="label">Ma sélection</p>
            <h2 className="h3">{items.length ? pluriel(items.length, 'point rouge', 'points rouges') : 'Aucun point rouge'}</h2>
          </div>
          <button type="button" className="icon-btn press" onClick={close} aria-label="Fermer la sélection" data-autofocus>
            <Close />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="drawer__empty">
            <span className="drawer__empty-dot">
              <Dot />
            </span>
            <p className="lead">En galerie, un point rouge à côté d’une œuvre veut dire : quelqu’un l’a choisie.</p>
            <p className="muted">
              Dans l’exposition, posez les vôtres sur les pièces qui vous retiennent. Nous les préparerons pour votre visite — sans engagement.
            </p>
          </div>
        ) : (
          <>
            <ul className="drawer__list">
              {items.map(a => (
                <li key={a.id} className="drawer__item">
                  <div className="drawer__thumb">
                    <Picture slug={a.image} alt="" sizes="96px" fit="contain" />
                  </div>
                  <div className="drawer__text">
                    <p className="label">{numero(a.id)}</p>
                    <p className="drawer__title">
                      <i>{a.titre}</i>
                    </p>
                    <p className="ui muted">{a.artiste}</p>
                    <p className="ui">{a.statut === 'réservée' ? 'Réservée — liste d’attente' : prix(a.prix)}</p>
                  </div>
                  <button type="button" className="drawer__remove label press" onClick={() => remove(a.id)} aria-label={`Retirer « ${a.titre} »`}>
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <p className="drawer__total ui">
                <span className="muted">Valeur indicative</span>
                <b>{prix(total)}</b>
              </p>
              <button type="button" className="btn" onClick={demander}>
                Demander ces œuvres <Arrow />
              </button>
              <p className="label">Certificat d’authenticité inclus. Expédition possible depuis Jacmel.</p>
            </div>
          </>
        )}
      </motion.aside>
    </Dialog>
  )
}
