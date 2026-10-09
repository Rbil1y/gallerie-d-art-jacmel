import { fr } from '../lib/fr'

export type Artiste = {
  id: string
  nom: string
  discipline: string
  depuis: number
  /** ce qu’ils regardent : une photographie de leur motif, pas un portrait */
  motif: { image: string; legende: string; position?: string }
  bio: string[]
  /** pièces passées par le registre de la maison depuis leur arrivée */
  registre: number
}

export const ARTISTES: Artiste[] = [
  {
    id: 'celestin',
    nom: 'Jean-Baptiste Célestin',
    discipline: 'Peintre',
    depuis: 1996,
    motif: { image: 'rade', legende: fr('Ce qu’il regarde : la rade de Jacmel, à six heures.') },
    bio: [
      fr('Trente ans à peindre la même baie, à six heures du matin. Rien d’autre ne l’intéresse, et c’est assez.'),
      fr('Il dit que la lumière de Jacmel change de matière avant de changer de couleur : d’abord du lait, puis du verre.'),
    ],
    registre: 14,
  },
  {
    id: 'morisset',
    nom: 'Atelier Morisset',
    discipline: 'Papier-mâché',
    depuis: 1972,
    motif: { image: 'galerie-masques', legende: fr('Ce qu’ils regardent : la rue, et les masques qui sèchent.'), position: '50% 40%' },
    bio: [
      fr('Une cour, trois foyers à colle de manioc, et le kanaval pour calendrier.'),
      fr('Quatre générations s’y passent les moules en plâtre ; chaque masque porte encore l’empreinte du précédent.'),
    ],
    registre: 22,
  },
  {
    id: 'derose',
    nom: 'Sophie Dérose',
    discipline: 'Photographe',
    depuis: 2015,
    motif: { image: 'canot', legende: fr('Ce qu’elle regarde : les canots tirés sur le sable.') },
    bio: [
      fr('Argentique uniquement, au moyen format. Douze vues par rouleau, douze décisions.'),
      fr('Elle photographie la côte à hauteur d’enfant, à marée basse, quand la plage devient une page blanche.'),
    ],
    registre: 9,
  },
]
