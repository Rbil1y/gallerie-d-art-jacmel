// Coquille commune des surcouches : focus piégé, Échap pour fermer, défilement verrouillé,
// et retour du focus là où il était.
import { useEffect, useRef, type ReactNode } from 'react'
import { useScrollApi } from '../state/scroll'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

type Props = {
  label: string
  onClose: () => void
  className?: string
  children: ReactNode
}

export function Dialog({ label, onClose, className = '', children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { lock } = useScrollApi()
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    lock(true)
    const el = ref.current
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE)
    const raf = requestAnimationFrame(() => first?.focus({ preventScroll: true }))

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(i => i.offsetParent !== null || i === document.activeElement)
      if (!items.length) return
      const a = items[0]
      const z = items[items.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      lock(false)
      previous?.focus?.({ preventScroll: true })
    }
  }, [lock])

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={className}>
      {children}
    </div>
  )
}
