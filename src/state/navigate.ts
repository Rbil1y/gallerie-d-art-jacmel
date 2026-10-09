// Aller dans une pièce : la même action depuis l’en-tête, le plan, le dock ou un lien.
import { useCallback } from 'react'
import { useExpo } from './expo'
import { useScrollApi, type Room } from './scroll'

export function useGo() {
  const { scrollTo } = useScrollApi()
  const { allerAuRegistre, allerAlAccrochage } = useExpo()
  return useCallback(
    (room: Room) => {
      switch (room) {
        case 'seuil':
          return scrollTo(0)
        case 'salle-1':
        case 'salle-2':
        case 'salle-3':
        case 'salle-4':
          return allerAlAccrochage(Number(room.slice(-1)))
        case 'registre':
          return allerAuRegistre()
        case 'rue':
          return scrollTo('#fermeture', { offset: 0 })
        default:
          return scrollTo(`#${room}`)
      }
    },
    [scrollTo, allerAuRegistre, allerAlAccrochage],
  )
}
