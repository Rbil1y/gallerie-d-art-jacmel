// L’arrivée : la porte est fermée. La béquille tourne, les lames s’ouvrent, puis les battants, et on passe le seuil.
// Attend les polices, l’image du seuil et les matières (3,2 s maximum). Version courte dans la même session.
import { useEffect, useRef, useState } from 'react'
import { Doors } from './Doors'
import { lire, ecrire } from '../lib/storage'
import { appareilModeste, reducedMotion } from '../lib/motion'
import { useLight } from '../state/light'
import { heure } from '../lib/jacmel'
import peintureH from '../assets/textures/peinture-h.webp'
import peintureV from '../assets/textures/peinture-v.webp'
import enduit from '../assets/textures/enduit.webp'
import palmes from '../assets/textures/palmes.webp'

type Stage = 'closed' | 'unlatch' | 'louvers' | 'opening' | 'fading' | 'gone'

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const decoder = (src: string) => {
  const image = new Image()
  image.src = src
  return image.decode().catch(() => undefined)
}

export function Intro({ onOpen, onDone }: { onOpen: () => void; onDone: () => void }) {
  const reduced = reducedMotion() || appareilModeste()
  const [stage, setStage] = useState<Stage>('closed')
  const [ready, setReady] = useState(false)
  // ?motion=full : démonstration, toujours la version longue
  const [quick] = useState(() => !/[?&]motion=full(&|$)/.test(location.search) && lire('gallerie:entree', false, 'session'))
  const { now, open } = useLight()
  const started = useRef(false)
  const cbs = useRef({ onOpen, onDone })
  cbs.current = { onOpen, onDone }

  const go = (fast: boolean) => {
    if (started.current) return
    started.current = true
    if (reduced) {
      // mouvement réduit : les persiennes ne bougent pas, elles s’effacent
      setStage('fading')
      cbs.current.onOpen()
      setTimeout(() => {
        setStage('gone')
        cbs.current.onDone()
      }, 280)
      return
    }
    const latch = fast ? 110 : 420
    const louvers = fast ? 320 : 1020
    const doors = fast ? 1050 : 1950
    setStage('unlatch')
    setTimeout(() => setStage('louvers'), latch)
    setTimeout(() => {
      setStage('opening')
      cbs.current.onOpen()
    }, latch + louvers)
    setTimeout(() => {
      setStage('gone')
      cbs.current.onDone()
    }, latch + louvers + doors)
  }

  useEffect(() => {
    ecrire('gallerie:entree', true, 'session')
    document.documentElement.classList.add('is-locked')
    const hero = document.querySelector<HTMLImageElement>('img[data-hero]')
    const matieres = Promise.all([peintureH, peintureV, enduit, palmes].map(decoder))
    Promise.race([matieres, wait(1400)]).then(() => setReady(true))
    const gates = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      hero?.decode?.().catch(() => undefined) ?? Promise.resolve(),
      matieres,
      wait(quick ? 120 : reduced ? 750 : 1800),
    ])
    Promise.race([gates, wait(3200)]).then(() => go(quick))

    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && ['Shift', 'Alt', 'Control', 'Meta', 'Tab'].includes(e.key)) return
      go(true)
    }
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stage === 'opening' || stage === 'fading' || stage === 'gone') document.documentElement.classList.remove('is-locked')
  }, [stage])

  if (stage === 'gone') return null
  return (
    <div className={`intro intro--${stage} ${ready ? 'intro--ready' : ''} ${quick ? 'intro--quick' : ''}`} onClick={() => go(true)}>
      <Doors
        className="intro__doors"
        sign={{
          main: 'Gallerie d’art',
          script: 'de Jacmel',
          small: `Rue Barranquilla · ${open.open ? 'ouvert' : 'fermé'} · ${heure(now)}`,
        }}
      />
      <button type="button" className="intro__skip ui" onClick={() => go(true)}>
        Entrer
      </button>
    </div>
  )
}
