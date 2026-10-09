// Le plan de la maison : la navigation dessinée comme un relevé d’architecte.
// Murs pochés, débattements de portes, enfilade des salles de la terre vers la mer.
import { motion } from 'motion/react'
import type { Room } from '../state/scroll'

export type PlanRoom = {
  id: Room
  label: string
  /** x, y, largeur, hauteur dans le repère 400 × 280 */
  r: [number, number, number, number]
  court?: boolean
}

export const PLAN_ROOMS: PlanRoom[] = [
  { id: 'registre', label: 'Registre', r: [16, 16, 134, 76] },
  { id: 'ateliers', label: 'Ateliers', r: [150, 16, 140, 76], court: true },
  { id: 'carnets', label: 'Carnets', r: [290, 16, 94, 76] },
  { id: 'salle-1', label: 'Salle 1', r: [16, 92, 92, 84] },
  { id: 'salle-2', label: 'Salle 2', r: [108, 92, 92, 84] },
  { id: 'salle-3', label: 'Salle 3', r: [200, 92, 92, 84] },
  { id: 'salle-4', label: 'Salle 4', r: [292, 92, 92, 84] },
  { id: 'comptoir', label: 'Comptoir', r: [16, 176, 134, 60] },
  { id: 'seuil', label: 'Seuil', r: [150, 176, 100, 60] },
  { id: 'maison', label: 'Salon', r: [250, 176, 134, 60] },
]

export const ROOM_NAMES: Record<Room, string> = {
  seuil: 'Le seuil',
  maison: 'La maison',
  'salle-1': 'Salle 1 — Matière',
  'salle-2': 'Salle 2 — Rite',
  'salle-3': 'Salle 3 — Lumière',
  'salle-4': 'Salle 4 — Littoral',
  registre: 'Le registre',
  ateliers: 'Les ateliers',
  carnets: 'Les carnets',
  comptoir: 'Le comptoir',
  rue: 'La rue',
}

const center = (id: Room): [number, number] => {
  if (id === 'rue') return [200, 258]
  const room = PLAN_ROOMS.find(r => r.id === id)!
  // le point se pose au-dessus du nom de la pièce
  return [room.r[0] + room.r[2] / 2, room.r[1] + room.r[3] / 2 - 17]
}

/** Murs : contour + cloisons, avec les ouvertures des portes (dessinés en tracés). */
const WALLS = [
  // façade arrière
  'M16 16 H384',
  // côtés
  'M16 16 V236',
  'M384 16 V236',
  // façade sur rue, porte d’entrée entre 182 et 218
  'M16 236 H182',
  'M218 236 H384',
  // cloison arrière / salles (ouvertures : registre 60–84, cour 222–262, carnets 326–350)
  'M16 92 H60',
  'M84 92 H222',
  'M262 92 H326',
  'M350 92 H384',
  // cloison salles / avant (ouvertures : seuil 188–212)
  'M16 176 H188',
  'M212 176 H384',
  // enfilade des salles (ouvertures 122–146)
  'M108 92 V122',
  'M108 146 V176',
  'M200 92 V122',
  'M200 146 V176',
  'M292 92 V122',
  'M292 146 V176',
  // rang arrière
  'M150 16 V92',
  'M290 16 V92',
  // rang avant (ouvertures 194–218)
  'M150 176 V194',
  'M150 218 V236',
  'M250 176 V194',
  'M250 218 V236',
]

/** Débattements de portes : quart de cercle + battant. */
const SWINGS = [
  'M182 236 A18 18 0 0 1 200 218 M182 236 L182 218',
  'M218 236 A18 18 0 0 0 200 218 M218 236 L218 218',
  'M188 176 A24 24 0 0 0 212 152 M188 176 L188 152',
  'M60 92 A24 24 0 0 0 84 116 M60 92 L60 116',
  'M350 92 A24 24 0 0 1 326 116 M350 92 L350 116',
]

type Props = {
  room: Room
  onSelect?: (id: Room) => void
  labels?: boolean
  className?: string
  title?: string
}

export function PlanSvg({ room, onSelect, labels = true, className = '', title }: Props) {
  const [cx, cy] = center(room)
  return (
    <svg
      className={`plan ${className}`}
      viewBox="0 0 400 280"
      role={onSelect ? 'group' : title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={!onSelect && !title ? true : undefined}
      focusable="false"
    >
      {/* pièces (zones cliquables) */}
      {PLAN_ROOMS.map(p => {
        const [x, y, w, h] = p.r
        const active = p.id === room
        const body = (
          <>
            <rect className={`plan__room ${active ? 'is-active' : ''} ${p.court ? 'is-court' : ''}`} x={x + 3} y={y + 3} width={w - 6} height={h - 6} />
            {p.court && <circle className="plan__tree" cx={x + w - 30} cy={y + 30} r={14} />}
            {labels && (
              <text className="plan__label" x={x + w / 2} y={y + h / 2 + (p.court ? 6 : 4)} textAnchor="middle">
                {p.label}
              </text>
            )}
          </>
        )
        return onSelect ? (
          <a
            key={p.id}
            href={`#${p.id}`}
            aria-label={ROOM_NAMES[p.id]}
            aria-current={active ? 'location' : undefined}
            onClick={e => {
              e.preventDefault()
              onSelect(p.id)
            }}
          >
            {body}
          </a>
        ) : (
          <g key={p.id}>{body}</g>
        )
      })}
      <g className="plan__walls">
        {WALLS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="plan__swings">
        {SWINGS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {labels && (
        <>
          <text className="plan__street" x={200} y={262} textAnchor="middle">
            Rue Barranquilla
          </text>
          <text className="plan__side" x={16} y={274}>
            Terre
          </text>
          <text className="plan__side" x={384} y={274} textAnchor="end">
            Mer
          </text>
        </>
      )}
      <motion.circle
        className="plan__dot"
        r={labels ? 6 : 16}
        initial={false}
        animate={{ cx, cy }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      />
    </svg>
  )
}
