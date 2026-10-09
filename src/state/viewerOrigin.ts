// D’où l’œuvre a été ouverte (mur, seuil, registre…) : l’image se décroche de cet endroit précis.
import { useCallback } from 'react'
import { useRoute } from './route'

export const viewerOrigin = { id: '', source: '' }

export const layoutIdFor = (id: string, source: string) => `oeuvre-${id}-${source}`

export function useOpenArtwork() {
  const { open } = useRoute()
  return useCallback(
    (id: string, source: string) => {
      viewerOrigin.id = id
      viewerOrigin.source = source
      open({ kind: 'oeuvre', id })
    },
    [open],
  )
}
