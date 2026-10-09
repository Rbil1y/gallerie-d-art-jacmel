// L’arrivée : les persiennes sont fermées. Les lames s’ouvrent, la lumière passe, puis les battants.
// Attend les polices et l’image du seuil (2,6 s maximum). Version courte dans la même session.
import { useEffect, useRef, useState } from 'react'
import { Doors } from './Doors'
import { lire, ecrire } from '../lib/storage'
import { reducedMotion } from '../lib/motion'
import { useLight } from '../state/light'
import { heure } from '../lib/jacmel'

type Stage = 'closed' | 'louvers' | 'opening' | 'fading' | 'gone'

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export function Intro({ onOpen, onDone }: { onOpen: () => void; onDone: () => void }) {
  const reduced = reducedMotion()
  const [stage, setStage] = useState<Stage>('closed')
  const [quick] = useState(() => lire('gallerie:entree', false, 'session'))
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
    const louvers = fast ? 220 : 760
    const doors = fast ? 760 : 1250
    setStage('louvers')
    setTimeout(() => {
      setStage('opening')
      cbs.current.onOpen()
    }, louvers)
    setTimeout(() => {
      setStage('gone')
      cbs.current.onDone()
    }, louvers + doors)
  }

  useEffect(() => {
    ecrire('gallerie:entree', true, 'session')
    document.documentElement.classList.add('is-locked')
    const hero = document.querySelector<HTMLImageElement>('img[data-hero]')
    const gates = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      hero?.decode?.().catch(() => undefined) ?? Promise.resolve(),
      wait(quick ? 120 : reduced ? 750 : 1000),
    ])
    Promise.race([gates, wait(2600)]).then(() => go(quick))

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
    <div className={`intro intro--${stage} ${quick ? 'intro--quick' : ''}`} onClick={() => go(true)}>
      <Doors
        className="intro__doors"
        sign={
          <>
            <span className="sign__main">Gallerie d’art</span>
            <span className="sign__script">de Jacmel</span>
            <span className="sign__small">
              Rue Barranquilla · {open.open ? 'ouvert' : 'fermé'} · {heure(now)}
            </span>
          </>
        }
      />
      <button type="button" className="intro__skip ui" onClick={() => go(true)}>
        Entrer
      </button>
    </div>
  )
}
