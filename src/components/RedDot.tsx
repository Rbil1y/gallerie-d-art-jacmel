// Le point rouge : en galerie, la pastille posée à côté d’une œuvre réservée.
// Ici, le visiteur peut poser le sien.
import { motion, AnimatePresence } from 'motion/react'
import { useSelection } from '../state/selection'

export const Dot = ({ className = '' }: { className?: string }) => <span className={`dot ${className}`} aria-hidden />

type ToggleProps = { id: string; titre: string; compact?: boolean; className?: string }

export function DotToggle({ id, titre, compact, className = '' }: ToggleProps) {
  const { has, toggle } = useSelection()
  const on = has(id)
  return (
    <button
      type="button"
      className={`dot-toggle press ${on ? 'is-on' : ''} ${compact ? 'dot-toggle--compact' : ''} ${className}`}
      aria-pressed={on}
      aria-label={compact ? `${on ? 'Retirer' : 'Mettre'} un point rouge sur « ${titre} »` : undefined}
      onClick={e => {
        e.stopPropagation()
        toggle(id)
      }}
    >
      <span className="dot-toggle__well" aria-hidden>
        <AnimatePresence initial={false}>
          {on && (
            <motion.span
              className="dot dot-toggle__sticker"
              initial={{ scale: 1.9, rotate: -24, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.42 }}
            />
          )}
        </AnimatePresence>
      </span>
      {!compact && <span className="dot-toggle__label">{on ? 'Point rouge posé' : 'Mettre un point rouge'}</span>}
    </button>
  )
}
