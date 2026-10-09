// Les huit pièces de « Terre / Mer ». Pour remplacer une photographie :
// déposer assets/photos/<slug>.jpg (même slug) puis npm run images.
import { fr } from '../lib/fr'

export type Technique = 'peinture' | 'sculpture' | 'papier-mâché' | 'photographie'
export type SalleNo = 1 | 2 | 3 | 4

export type Artwork = {
  id: string
  titre: string
  artiste: string
  annee: number
  technique: Technique
  medium: string
  /** hauteur × largeur, en centimètres */
  hCm: number
  lCm: number
  prix: number
  statut: 'disponible' | 'réservée'
  image: string
  salle: SalleNo
  provenance: string
}

export type Salle = {
  no: SalleNo
  nom: string
  cote: 'Terre' | 'Mer' | null
  texte: string
  /** photographie documentaire accrochée près du texte de salle */
  document?: { image: string; legende: string }
}

export const SALLES: Salle[] = [
  {
    no: 1,
    nom: 'Matière',
    cote: 'Terre',
    texte: fr('Avant l’image, il y a ce qu’on ramasse : un fût d’huile, du papier journal, de la colle de manioc. Ici, la matière arrive la première, et l’idée la suit.'),
  },
  {
    no: 2,
    nom: 'Rite',
    cote: null,
    texte: fr('Au kanaval, on ne porte pas un masque : on le prête à quelqu’un d’autre pour une journée. Ces pièces ont défilé, dansé, transpiré. Elles se reposent.'),
    document: { image: 'kanaval-visage', legende: 'Kanaval de Jacmel, février 2014.' },
  },
  {
    no: 3,
    nom: 'Lumière',
    cote: null,
    texte: fr('La lumière de Jacmel change de matière avant de changer de couleur : du lait à six heures, du verre à midi, du cuivre à cinq. Deux peintres l’ont prise au mot.'),
  },
  {
    no: 4,
    nom: 'Littoral',
    cote: 'Mer',
    texte: fr('Au bout de la ligne, la baie. Une peinture et une photographie la regardent sans se parler ; l’une la reconstruit, l’autre l’attend.'),
  },
]

export const ARTWORKS: Artwork[] = [
  {
    id: '004',
    titre: 'Lasirèn',
    artiste: 'Dimitri Benjamin',
    annee: 2024,
    technique: 'sculpture',
    medium: 'Fer découpé, tôle de fût récupérée',
    hCm: 80,
    lCm: 120,
    prix: 3400,
    statut: 'disponible',
    image: 'lasiren',
    salle: 1,
    provenance: fr('Découpée au burin dans un fût de cinquante-cinq gallons, martelée à froid, point par point.'),
  },
  {
    id: '008',
    titre: 'Kochon, mémoire',
    artiste: 'Atelier Morisset',
    annee: 2014,
    technique: 'papier-mâché',
    medium: 'Papier-mâché, noir de fumée',
    hCm: 54,
    lCm: 36,
    prix: 1900,
    statut: 'disponible',
    image: 'kochon',
    salle: 1,
    provenance: fr('Porté au kanaval de 2014. Le cochon noir se souvient des cochons créoles abattus entre 1982 et 1984.'),
  },
  {
    id: '002',
    titre: 'Masque du kanaval',
    artiste: 'Atelier Morisset',
    annee: 2014,
    technique: 'papier-mâché',
    medium: 'Papier-mâché, pigments naturels',
    hCm: 60,
    lCm: 40,
    prix: 1850,
    statut: 'disponible',
    image: 'masque',
    salle: 2,
    provenance: fr('Porté au défilé de février, rue du Commerce. Colle de manioc, papier journal, quatre couches.'),
  },
  {
    id: '007',
    titre: 'Esprit du vaudou',
    artiste: 'Wilner Désir',
    annee: 2021,
    technique: 'peinture',
    medium: 'Technique mixte sur toile',
    hCm: 100,
    lCm: 150,
    prix: 6400,
    statut: 'réservée',
    image: 'esprit',
    salle: 2,
    provenance: fr('Déposée à la maison avant l’exposition de Montréal. Elle n’en est jamais repartie.'),
  },
  {
    id: '005',
    titre: 'Marché en couleurs',
    artiste: 'Lucien Saint-Vil',
    annee: 2023,
    technique: 'peinture',
    medium: 'Acrylique sur toile',
    hCm: 95,
    lCm: 120,
    prix: 3900,
    statut: 'disponible',
    image: 'marche',
    salle: 3,
    provenance: fr('Le marché en fer, un samedi, à sept heures.'),
  },
  {
    id: '003',
    titre: 'Femme au regard bleu',
    artiste: 'Marie Lourdes Joseph',
    annee: 2022,
    technique: 'peinture',
    medium: 'Acrylique et aérosol sur panneau',
    hCm: 80,
    lCm: 120,
    prix: 3600,
    statut: 'réservée',
    image: 'regard',
    salle: 3,
    provenance: fr('Peinte sur une palissade de chantier, démontée panneau par panneau. La signature d’un autre est restée.'),
  },
  {
    id: '001',
    titre: 'Lumière sur la baie',
    artiste: 'Jean-Baptiste Célestin',
    annee: 2023,
    technique: 'peinture',
    medium: 'Acrylique sur toile',
    hCm: 120,
    lCm: 120,
    prix: 4200,
    statut: 'disponible',
    image: 'baie',
    salle: 4,
    provenance: fr('Peinte depuis la terrasse de l’atelier, à six heures, avant que la baie ne blanchisse.'),
  },
  {
    id: '006',
    titre: 'Horizons, série plage',
    artiste: 'Sophie Dérose',
    annee: 2024,
    technique: 'photographie',
    medium: 'Photographie argentique, tirage pigmentaire 2/7',
    hCm: 60,
    lCm: 90,
    prix: 1200,
    statut: 'disponible',
    image: 'horizons',
    salle: 4,
    provenance: fr('Raymond-les-Bains, marée basse. Pellicule exposée à l’aube.'),
  },
]

export const parSalle = (no: SalleNo) => ARTWORKS.filter(a => a.salle === no)
export const oeuvre = (id: string) => ARTWORKS.find(a => a.id === id)
export const TECHNIQUES: Technique[] = ['peinture', 'sculpture', 'papier-mâché', 'photographie']
/** La lumière rasante n’a pas de sens sur un tirage photographique : la surface est plane. */
export const relief = (a: Artwork) => a.technique !== 'photographie'
