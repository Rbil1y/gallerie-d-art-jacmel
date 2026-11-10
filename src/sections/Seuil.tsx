// Le seuil. On a passé la porte : Jacmel en miniature, exactement dans l’axe de l’ouverture.
// Terre à gauche, Mer à droite. Une affiche s’affiche d’abord, puis la vraie 3D prend le relais.
// Le défilement écarte le titre, descend dans les rues jusqu’à la porte du point rouge, et l’on entre : le mur de la section suivante.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { Picture } from '../components/Picture'
import { Dot } from '../components/RedDot'
import { ArrowDown } from '../components/Icons'
import { EXPO } from '../content/site'
import MAQUETTE from '../content/maquette.gen.json'
import { useLight } from '../state/light'
import { useGo } from '../state/navigate'
import { appareilModeste, finePointer, reducedMotion } from '../lib/motion'
import { etatExposition } from '../lib/jacmel'
import type { Maquette } from '../maquette/scene'

/** Le temps que la porte finisse de s’ouvrir et que l’affiche se pose. */
const POSE_MS = 2700
const smooth = (a: number, b: number, v: number) => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

export function Seuil({ entered }: { entered: boolean }) {
  const light = useLight()
  const go = useGo()
  const etat = etatExposition(light.now, EXPO.debut, EXPO.fin)
  const kicker = etat === 'à venir' ? 'Exposition à venir' : etat === 'en cours' ? 'Exposition en cours' : 'Exposition passée'

  const [fixe] = useState(reducedMotion)
  const [posee, setPosee] = useState(false)
  const [vivante, setVivante] = useState(false)
  useEffect(() => {
    if (!entered || fixe) return
    const id = setTimeout(() => setPosee(true), POSE_MS)
    return () => clearTimeout(id)
  }, [entered, fixe])

  const section = useRef<HTMLElement>(null)
  const salle = useRef<HTMLDivElement>(null)
  const pres = useRef<HTMLDivElement>(null)
  const affiche = useRef<HTMLDivElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const point = useRef<HTMLSpanElement>(null)
  const maquette = useRef<Maquette | null>(null)
  const decalage = useRef(0)

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })

  /** Le point rouge suit la maison ; tant que la 3D n’est pas là, il se cale sur l’affiche. */
  const suivre = useCallback(() => {
    const s = salle.current
    const d = point.current
    if (!s || !d) return
    const m = maquette.current
    if (m) {
      const q = m.pointGalerie()
      const p = scrollYProgress.get()
      d.style.transform = `translate3d(${q.x.toFixed(1)}px, ${(q.y + decalage.current * (1 - p * p)).toFixed(1)}px, 0)`
      return
    }
    const a = affiche.current?.getBoundingClientRect()
    const r = s.getBoundingClientRect()
    if (a) d.style.transform = `translate3d(${(a.left - r.left + a.width * MAQUETTE.point[0]).toFixed(1)}px, ${(a.top - r.top + a.height * MAQUETTE.point[1]).toFixed(1)}px, 0)`
  }, [scrollYProgress])

  const caler = useCallback(() => {
    const s = salle.current
    const q = pres.current
    if (!s || !q) return
    const a = q.getBoundingClientRect()
    const b = s.getBoundingClientRect()
    decalage.current = a.top + a.height / 2 - (b.top + b.height / 2)
    s.style.setProperty('--decalage', `${decalage.current.toFixed(1)}px`)
    maquette.current?.dimensionner()
    suivre()
  }, [suivre])

  useEffect(() => {
    caler()
    window.addEventListener('resize', caler)
    return () => window.removeEventListener('resize', caler)
  }, [caler])

  // la 3D ne se charge qu’une fois la porte passée, et seulement là où elle sera fluide
  useEffect(() => {
    const c = toile.current
    // seul un choix explicite du visiteur (économie de données) coupe la 3D : l’estimation de débit du navigateur n’est pas fiable,
    // et le chargement se fait derrière l’affiche, sans rien bloquer
    const economie = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!posee || fixe || !c || appareilModeste() || economie) return
    let annule = false
    import('../maquette/scene')
      .then(({ creerMaquette }) =>
        creerMaquette(c, {
          echelle: () => ((pres.current?.offsetWidth ?? 500) * 1.04) / (0.674 * (c.clientHeight || 1)),
          apresImage: suivre,
          exigeant: true,
        }),
      )
      .then(m => {
        if (annule) return m.detruire()
        maquette.current = m
        m.dimensionner() // la fenêtre a pu changer de taille pendant la construction
        m.regler({ pas: scrollYProgress.get() })
        m.rendre()
        setVivante(true)
      })
      .catch(() => undefined) // l’affiche reste : rien de cassé pour le visiteur
    return () => {
      annule = true
      maquette.current?.detruire()
      maquette.current = null
    }
  }, [posee, fixe, scrollYProgress, suivre])

  useEffect(() => {
    if (!vivante) return
    maquette.current?.soleil(light.elevation, light.azimuth, 1 - smooth(4, 40, light.elevation), light.night)
  }, [vivante, light.elevation, light.azimuth, light.night])

  // Le défilement n'est donné qu'aux éléments qui s'en servent. Posé sur la salle entière, il ferait recalculer
  // tout ce qu'elle contient, et repeindre le mur, à chaque image.
  const suiveurs = useRef<HTMLElement[]>([])
  useEffect(() => {
    if (fixe) return
    suiveurs.current = [...(salle.current?.querySelectorAll<HTMLElement>('[data-pas]') ?? [])]
    const v = scrollYProgress.get().toFixed(4)
    for (const el of suiveurs.current) el.style.setProperty('--p', v)
  }, [fixe, scrollYProgress])
  useMotionValueEvent(scrollYProgress, 'change', p => {
    maquette.current?.regler({ pas: p })
    const v = p.toFixed(4)
    for (const el of suiveurs.current) el.style.setProperty('--p', v)
  })

  useEffect(() => {
    if (!posee || fixe || !finePointer()) return
    const bouge = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      maquette.current?.regler({ souris: [x, y] })
    }
    window.addEventListener('pointermove', bouge, { passive: true })
    return () => window.removeEventListener('pointermove', bouge)
  }, [posee, fixe])

  return (
    <section ref={section} id="seuil" data-room="seuil" className={`seuil ${entered ? 'is-entered' : ''} ${fixe ? 'seuil--fixe' : ''} ${vivante ? 'is-vivante' : ''}`} aria-labelledby="seuil-titre">
      <div ref={salle} className="seuil__salle">
        <span className="seuil__mur" aria-hidden />

        <h1 id="seuil-titre" className="seuil__titre">
          <span className="sr-only">Terre / Mer — exposition à la Gallerie d’art de Jacmel</span>
          <span className="seuil__mot seuil__mot--terre display" data-pas aria-hidden>
            <span>Terre</span>
          </span>
          <span className="seuil__mot seuil__mot--mer display" data-pas aria-hidden>
            <span>
              <i>Mer</i>
            </span>
          </span>
        </h1>

        <div ref={pres} className="seuil__pres">
          <div className="seuil__proche" data-pas>
            <div ref={affiche} className="seuil__affiche">
              <div className="seuil__pose">
                <Picture
                  key={light.night ? 'nuit' : 'jour'}
                  slug={light.night ? 'jacmel-maquette-nuit' : 'jacmel-maquette'}
                  alt="Maquette en trois dimensions du centre-ville de Jacmel : le Marché en fer, la rue du Commerce, la Douane, le wharf et la baie."
                  sizes="(max-aspect-ratio: 1/1) 90vw, min(64vh, 42vw)"
                  fit="contain"
                  priority
                  hero
                />
              </div>
            </div>
          </div>
          <button type="button" className="seuil__cadre" onClick={() => go('comptoir')} aria-label="Préparer sa visite : la galerie, au cœur de Jacmel" />
        </div>

        <canvas ref={toile} className="seuil__toile" data-pas aria-hidden />
        <span ref={point} className="seuil__point" data-pas aria-hidden>
          <Dot />
        </span>

        <span className="seuil__voile" data-pas aria-hidden />

        <div className="seuil__pied" data-pas>
          <p className="seuil__dek">{EXPO.dek}</p>
          <button type="button" className="seuil__entrer" onClick={() => go('salle-1')}>
            <span>Entrer dans l’exposition</span>
            <ArrowDown />
          </button>
          <p className="seuil__dates ui">
            <span>{kicker}</span>
            <span>{EXPO.dates}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
