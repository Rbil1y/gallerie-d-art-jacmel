// « À l’échelle » : l’œuvre accrochée à 1,45 m, à côté d’une silhouette de 1,70 m.
import { motion } from 'motion/react'
import type { Artwork } from '../content/artworks'
import { Picture } from './Picture'
import { SPRING } from '../lib/motion'

const WALL_CM = 300
const CENTER_CM = 145
const PERSON_CM = 170

export function TrueScale({ a }: { a: Artwork }) {
  // tout est exprimé en % de la hauteur du mur visible (300 cm)
  const h = (a.hCm / WALL_CM) * 100
  const bottom = ((CENTER_CM - a.hCm / 2) / WALL_CM) * 100
  const person = (PERSON_CM / WALL_CM) * 100
  return (
    <div className="scale" style={{ '--ratio': a.lCm / a.hCm } as React.CSSProperties}>
      <div className="scale__room">
        <motion.div className="scale__art" style={{ height: `${h}%`, bottom: `${bottom}%`, x: '-50%' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
          <Picture slug={a.image} alt="" sizes="40vw" fit="contain" />
          <span className="scale__cote scale__cote--h label">{a.hCm} cm</span>
          <span className="scale__cote scale__cote--w label">{a.lCm} cm</span>
        </motion.div>
        <svg className="scale__person" style={{ height: `${person}%` }} viewBox="0 0 50 170" aria-hidden>
          <ellipse cx="25" cy="11" rx="7.6" ry="9.6" />
          <path d="M16 25.5Q25 21.5 34 25.5L40.5 30.5Q43.5 32.5 43.6 36.8L44.6 83.5Q44.6 87.8 41.4 87.8H39.8L38.6 52.5H37.8L37.4 97.5L35.6 167.6Q35.5 170 32.9 170H29.4L26.8 108.5H23.2L20.6 170H17.1Q14.5 170 14.4 167.6L12.6 97.5L12.2 52.5H11.4L10.2 87.8H8.6Q5.4 87.8 5.4 83.5L6.4 36.8Q6.5 32.5 9.5 30.5Z" />
        </svg>
        <div className="scale__floor" />
      </div>
      <p className="scale__legend label">Accrochage à 1,45 m du sol · silhouette de 1,70 m</p>
    </div>
  )
}
