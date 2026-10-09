// Révélation « persienne » : le contenu apparaît par lames, comme un volet qu’on ouvre.
// IntersectionObserver + transition CSS d’une propriété enregistrée (@property --slat-open).
import { useEffect, useRef, useState, type ElementType, type ReactNode, type CSSProperties } from 'react'
import { reducedMotion } from '../lib/motion'

type Props = Omit<React.HTMLAttributes<HTMLElement>, 'style' | 'className' | 'children' | 'id'> & {
  as?: ElementType
  children: ReactNode
  className?: string
  /** pas d’une lame (ex. '0.24em' pour un titre, '9%' pour une image) */
  pitch?: string
  delay?: number
  /** démarre seulement quand `ready` est vrai (après l’ouverture des portes) */
  ready?: boolean
  id?: string
  style?: CSSProperties
}

export function SlatReveal({ as: Tag = 'div', children, className = '', pitch = '0.22em', delay = 0, ready = true, id, style, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<'idle' | 'in' | 'done'>(() => (reducedMotion() ? 'done' : 'idle'))

  useEffect(() => {
    if (state !== 'idle' || !ready) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState('in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [state, ready])

  return (
    <Tag
      {...rest}
      ref={ref}
      id={id}
      className={`slat slat--${state} ${className}`}
      style={{ '--pitch': pitch, transitionDelay: `${delay}s`, ...style } as CSSProperties}
      onTransitionEnd={(e: React.TransitionEvent) => {
        if (e.target === e.currentTarget && state === 'in') setState('done')
      }}
    >
      {children}
    </Tag>
  )
}
