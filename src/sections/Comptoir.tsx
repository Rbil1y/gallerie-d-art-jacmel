// Le comptoir : venir à la maison, les horaires du jour, et la demande de visite
// (les points rouges du visiteur y arrivent tout seuls).
import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Picture } from '../components/Picture'
import { SlatReveal } from '../components/SlatReveal'
import { Arrow, Copy, Check, Close, ArrowUpRight } from '../components/Icons'
import { Dot } from '../components/RedDot'
import { MAISON, ACCES } from '../content/site'
import { oeuvre } from '../content/artworks'
import { useLight } from '../state/light'
import { useSelection } from '../state/selection'
import { useGo } from '../state/navigate'
import { LIGNES_HORAIRES, ligneDuJour, soleilDuJour, heure, jacmelTime } from '../lib/jacmel'
import { numero } from '../lib/fr'
import { SPRING } from '../lib/motion'

export function Comptoir() {
  const light = useLight()
  const { ids, remove } = useSelection()
  const go = useGo()
  const [sent, setSent] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const today = ligneDuJour(light.now)
  const soleil = soleilDuJour(light.now)
  const { y, m, d } = jacmelTime(light.now)
  const todayIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const titre = light.open.open ? 'La porte est ouverte.' : light.open.next?.quand === 'aujourd’hui' ? 'On ouvre tout à l’heure.' : 'Fermé pour aujourd’hui.'
  const works = ids.map(oeuvre).filter(Boolean) as NonNullable<ReturnType<typeof oeuvre>>[]

  const copier = () => {
    Promise.resolve(navigator.clipboard?.writeText(MAISON.email))
      .catch(() => undefined)
      .finally(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      })
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const nom = String(data.get('nom') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const errs: Record<string, string> = {}
    if (!nom) errs.nom = 'Votre nom, pour savoir qui sonne.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Une adresse e-mail valide, pour vous répondre.'
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setSent(nom.split(/\s+/)[0])
  }

  return (
    <section id="comptoir" data-room="comptoir" className="comptoir" aria-labelledby="comptoir-titre">
      <div className="comptoir__grid wrap">
        <div className="comptoir__info">
          <p className="label">Le comptoir · venir à la maison</p>
          <SlatReveal as="h2" id="comptoir-titre" className="h2" pitch="0.2em">
            {titre}
          </SlatReveal>
          <p className="lead comptoir__lede">{ACCES.lede}</p>
          <p className={`comptoir__live ui ${light.open.open ? 'is-open' : ''}`}>
            <span className="lamp" aria-hidden /> {light.open.label} <span className="muted">· il est {heure(light.now)} à Jacmel</span>
          </p>

          <figure className="comptoir__photo">
            <Picture slug="maison-boucard" alt="La maison Boucard, rue du Commerce : trois niveaux de colonnes et de balcons en fonte." sizes="(max-width: 1024px) 92vw, 44vw" />
            <figcaption className="label">Votre repère : la maison Boucard et ses balcons de fonte, rue du Commerce.</figcaption>
          </figure>
          <p className="comptoir__path">{ACCES.chemin}</p>
          <p className="ui muted">{ACCES.route}</p>

          <div className="comptoir__cols">
            <div>
              <h3 className="label">Heures d’ouverture</h3>
              <table className="hours ui">
                <tbody>
                  {LIGNES_HORAIRES.map((l, i) => (
                    <tr key={l.label} className={i === today ? 'is-today' : ''}>
                      <th scope="row">
                        {l.label}
                        {i === today && <span className="hours__today"> · aujourd’hui</span>}
                      </th>
                      <td>{l.heures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="comptoir__sun label">
                La lumière aujourd’hui : lever {heure(soleil.sunrise)} · coucher {heure(soleil.sunset)}
              </p>
            </div>
            <div>
              <h3 className="label">Nous joindre</h3>
              <ul className="contact ui">
                <li>
                  <span className="muted">Écrire</span>
                  <a className="link" href={`mailto:${MAISON.email}`}>
                    {MAISON.email}
                  </a>
                  <button type="button" className={`contact__copy press ${copied ? 'is-done' : ''}`} onClick={copier} aria-label="Copier l’adresse e-mail">
                    {copied ? <Check /> : <Copy />}
                    <span>{copied ? 'Copiée' : 'Copier'}</span>
                  </button>
                </li>
                <li>
                  <span className="muted">Appeler</span>
                  <a className="link" href={MAISON.telephoneHref}>
                    {MAISON.telephone}
                  </a>
                </li>
                <li>
                  <span className="muted">Suivre</span>
                  <a className="link" href={MAISON.instagram} target="_blank" rel="noreferrer">
                    Instagram <ArrowUpRight size={13} />
                  </a>
                </li>
                <li>
                  <span className="muted">Adresse</span>
                  <span>
                    {MAISON.rue}, {MAISON.ville} — {MAISON.region}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="comptoir__form-wrap">
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div key="merci" className="demande demande--merci" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING} role="status">
                <p className="label">Registre · demande reçue</p>
                <p className="demande__merci">Merci, {sent}.</p>
                <p className="lead">Votre demande est au registre. Nous répondons sous deux heures, aux heures d’ouverture, depuis la maison.</p>
                {works.length > 0 && (
                  <ul className="demande__recap ui">
                    {works.map(a => (
                      <li key={a.id}>
                        <Dot /> {numero(a.id)} — <i>{a.titre}</i>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => setSent(null)}>
                  Écrire un autre mot
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" className="demande" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="demande__head">
                  <p className="label">Demande de visite</p>
                  <p className="label">Gratuite, sans engagement</p>
                </div>
                <div className={`field ${errors.nom ? 'is-invalid' : ''}`}>
                  <label htmlFor="f-nom" className="label">
                    Votre nom
                  </label>
                  <input id="f-nom" name="nom" className="input" autoComplete="name" aria-invalid={!!errors.nom} aria-describedby={errors.nom ? 'f-nom-err' : undefined} />
                  {errors.nom && (
                    <p id="f-nom-err" className="field__error ui">
                      {errors.nom}
                    </p>
                  )}
                </div>
                <div className={`field ${errors.email ? 'is-invalid' : ''}`}>
                  <label htmlFor="f-email" className="label">
                    E-mail
                  </label>
                  <input id="f-email" name="email" type="email" inputMode="email" className="input" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'f-email-err' : undefined} />
                  {errors.email && (
                    <p id="f-email-err" className="field__error ui">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="f-date" className="label">
                    Date souhaitée <span className="field__opt">(facultatif)</span>
                  </label>
                  <input id="f-date" name="date" type="date" min={todayIso} className="input" />
                </div>
                <div className="field">
                  <span className="label" id="f-oeuvres">
                    Œuvres à préparer
                  </span>
                  {works.length ? (
                    <ul className="demande__chips" aria-labelledby="f-oeuvres">
                      {works.map(a => (
                        <li key={a.id} className="chip chip--on ui">
                          <Dot /> <i>{a.titre}</i>
                          <button type="button" className="chip__x press" onClick={() => remove(a.id)} aria-label={`Retirer « ${a.titre} »`}>
                            <Close size={13} />
                          </button>
                          <input type="hidden" name="oeuvres" value={a.id} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="demande__none ui muted">
                      Aucun point rouge pour l’instant.{' '}
                      <button type="button" className="link" onClick={() => go('salle-1')}>
                        Parcourir l’exposition
                      </button>
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="f-message" className="label">
                    Votre mot
                  </label>
                  <textarea id="f-message" name="message" rows={4} className="input" placeholder="Une pièce, un budget, une question, une heure d’arrivée…" />
                </div>
                <button type="submit" className="btn demande__submit">
                  Envoyer la demande <Arrow />
                </button>
                <p className="label">Réponse sous deux heures en journée. Ni liste, ni lettre d’information.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
