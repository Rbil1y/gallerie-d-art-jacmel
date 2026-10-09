// En-tête : l’enseigne, les pièces, l’état de la maison, la sélection et le plan.
import { useEffect, useState } from 'react'
import { useScrollApi, type Room } from '../state/scroll'
import { useRoute } from '../state/route'
import { useSelection } from '../state/selection'
import { useLight } from '../state/light'
import { useGo } from '../state/navigate'
import { heure } from '../lib/jacmel'
import { PlanSvg } from './Plan'
import { Dot } from './RedDot'
import { Frame } from './Icons'

export const NAV: { label: string; room: Room; rooms: Room[] }[] = [
  { label: 'Exposition', room: 'salle-1', rooms: ['salle-1', 'salle-2', 'salle-3', 'salle-4'] },
  { label: 'Registre', room: 'registre', rooms: ['registre'] },
  { label: 'Ateliers', room: 'ateliers', rooms: ['ateliers'] },
  { label: 'Carnets', room: 'carnets', rooms: ['carnets'] },
  { label: 'Visiter', room: 'comptoir', rooms: ['comptoir'] },
]

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <span className="logo__sign">Gallerie d’art</span>
      <span className="logo__de">
        de Jacmel
        <Dot className="logo__dot" />
      </span>
    </span>
  )
}

export function Header() {
  const { room } = useScrollApi()
  const { open } = useRoute()
  const { ids } = useSelection()
  const light = useLight()
  const go = useGo()
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 8)
      if (Math.abs(y - last) > 6) {
        setHidden(y > 160 && y > last)
        last = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`hdr ${hidden ? 'is-hidden' : ''} ${solid ? 'is-solid' : ''}`}>
      <a
        className="hdr__brand press"
        href="#seuil"
        aria-label="Gallerie d’art de Jacmel — retour au seuil"
        onClick={e => {
          e.preventDefault()
          go('seuil')
        }}
      >
        <Logo />
      </a>

      <nav className="hdr__nav ui" aria-label="Principale">
        {NAV.map(n => (
          <a
            key={n.label}
            href={`#${n.room}`}
            aria-current={n.rooms.includes(room) ? 'location' : undefined}
            onClick={e => {
              e.preventDefault()
              go(n.room)
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>

      <div className="hdr__right">
        <a
          className={`hdr__status ui ${light.open.open ? 'is-open' : ''}`}
          href="#comptoir"
          onClick={e => {
            e.preventDefault()
            go('comptoir')
          }}
        >
          <span className="lamp" aria-hidden />
          <span className="hdr__time">{heure(light.now)}</span>
          <span className="hdr__status-label">
            <span aria-hidden>· </span>
            {light.open.label}
          </span>
        </a>
        <button
          type="button"
          className="hdr__sel ui press"
          onClick={() => open({ kind: 'selection' })}
          aria-label={`Ma sélection : ${ids.length} œuvre${ids.length > 1 ? 's' : ''}`}
        >
          <Dot className={ids.length ? '' : 'is-empty'} />
          <span>Sélection</span>
          <span className="hdr__count">{ids.length}</span>
        </button>
        <button type="button" className="hdr__plan ui press" onClick={() => open({ kind: 'plan' })} aria-label="Plan de la maison">
          <PlanSvg room={room} labels={false} className="plan--mini" />
          <span>Plan</span>
        </button>
      </div>
    </header>
  )
}

export function Dock() {
  const { room } = useScrollApi()
  const { open } = useRoute()
  const { ids } = useSelection()
  const go = useGo()
  const inExpo = room.startsWith('salle') || room === 'registre'
  return (
    <nav className="dock ui" aria-label="Navigation rapide">
      <button type="button" className="dock__item press" onClick={() => open({ kind: 'plan' })}>
        <PlanSvg room={room} labels={false} className="plan--mini" />
        <span>Plan</span>
      </button>
      <button type="button" className="dock__item press" aria-current={inExpo ? 'location' : undefined} onClick={() => go('salle-1')}>
        <Frame className="dock__glyph" />
        <span>Exposition</span>
      </button>
      <button type="button" className="dock__item press" onClick={() => open({ kind: 'selection' })} aria-label={`Ma sélection : ${ids.length}`}>
        <span className="dock__sel">
          <Dot className={ids.length ? '' : 'is-empty'} />
          <b>{ids.length}</b>
        </span>
        <span>Sélection</span>
      </button>
      <button type="button" className="dock__item press" aria-current={room === 'comptoir' ? 'location' : undefined} onClick={() => go('comptoir')}>
        <span className="lamp" aria-hidden />
        <span>Visiter</span>
      </button>
    </nav>
  )
}
