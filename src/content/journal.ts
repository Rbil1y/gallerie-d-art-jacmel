import { fr } from '../lib/fr'

export type Carnet = {
  no: string
  genre: string
  lecture: string
  date: string
  titre: string
  dek: string
  image: string
  position?: string
  legende: string
  corps: { q?: string; p: string }[]
}

export const CARNETS: Carnet[] = [
  {
    no: '14',
    genre: 'Reportage',
    lecture: '6 min',
    date: 'Février 2026',
    titre: fr('Dans l’atelier Morisset, le papier devient masque'),
    dek: fr('Colle de manioc, ponçage, première couche — et ce bleu qui ne s’invente pas. Une matinée dans la cour, avant la chaleur.'),
    image: 'masques-mur',
    legende: fr('Masques en papier-mâché, Jacmel.'),
    corps: [
      { p: fr('À six heures, la cour de l’atelier Morisset sent déjà l’amidon. Sur trois foyers, des marmites de colle de manioc frémissent ; on la remue au bâton jusqu’à ce qu’elle file comme du miel. Le papier, lui, vient de partout : journaux de la semaine, sacs de ciment, cahiers d’école dont on devine encore les dictées.') },
      { p: fr('Le masque commence en argile. On modèle le visage — cornes, groin, gueule ouverte — puis on le couvre de bandes de papier encollé : quatre couches au moins, six pour ceux qui défileront. Ensuite, on attend. En février, le soleil de Jacmel sèche une couche en une matinée ; à la saison des pluies, il faut trois jours, et de la patience.') },
      { p: fr('Quand le papier a durci, on casse l’argile de l’intérieur. Il reste une coque légère qu’on ponce, qu’on enduit de blanc, puis qu’on peint. Le bleu des Morisset est un bleu de lessive mêlé d’un peu d’huile : il ne se vend dans aucune boutique, il se transmet.') },
      { p: fr('Quatre générations se sont succédé dans cette cour. Les moules en plâtre passent de main en main, et chaque masque porte, sous sa peinture, l’empreinte du précédent. « On ne refait jamais le même, dit l’aîné. On refait celui d’avant, en mieux. »') },
    ],
  },
  {
    no: '13',
    genre: 'Essai',
    lecture: '5 min',
    date: 'Janvier 2026',
    titre: fr('Pourquoi Jacmel peint en bleu océan'),
    dek: fr('Pigment, mer et embargo. Une histoire matérielle de la couleur, racontée par ceux qui la broient.'),
    image: 'rue-conti',
    position: '50% 55%',
    legende: fr('Maison, rue de Conti, Jacmel.'),
    corps: [
      { p: fr('Marchez rue de Conti, rue d’Orléans, rue du Commerce : les persiennes y sont bleues, ou vertes, ou de ce bleu-vert qui hésite entre les deux. On a longtemps parlé de coquetterie. C’est d’abord une affaire de matière.') },
      { p: fr('Les anciens peintres de la ville racontent que les pigments arrivaient autrefois par les navires qui emportaient le café, et que les bleus tenaient mieux au sel que les ocres. Pendant l’embargo du début des années quatre-vingt-dix, il a fallu broyer ce qu’on trouvait : bleu de lessive, oxyde de cuivre, chaux. La couleur a changé de recette, pas de nom.') },
      { p: fr('Il y a aussi la mer. Vue de la rade, la ville se fond dans l’eau à partir de cinq heures, et les façades prennent le relais de la baie. Les peintres de Jacmel n’imitent pas l’océan : ils le continuent, mur après mur.') },
      { p: fr('À la maison, nous gardons un nuancier de quarante-deux bleus relevés sur les volets de la ville depuis 1987. Certains ont disparu avec le séisme de 2010. Les autres sèchent encore, chaque matin, au soleil.') },
    ],
  },
  {
    no: '12',
    genre: 'Carnet',
    lecture: '4 min',
    date: 'Décembre 2025',
    titre: fr('Conserver une toile sous climat tropical'),
    dek: fr('Température, sel, lumière. Nos protocoles de conservation, sans jargon et sans secret.'),
    image: 'esprit',
    position: '30% 50%',
    legende: fr('Détail d’« Esprit du vaudou », Wilner Désir, 2021.'),
    corps: [
      { p: fr('Une toile ne craint pas la chaleur autant qu’on le croit. Ce qui l’abîme, ce sont les écarts : trente-deux degrés l’après-midi, vingt-deux la nuit, et l’humidité qui monte avec la marée. Le châssis gonfle, la toile se détend, puis se retend. Au bout de quelques saisons, la peinture craquelle.') },
      { p: fr('Nous gardons donc les réserves à l’étage, côté cour, persiennes mi-closes. L’air circule, la lumière directe n’entre jamais. Un hygromètre de laiton, acheté en 1987, veille sur la pièce ; nous ne l’avons jamais changé, il ne s’est jamais trompé.') },
      { p: fr('Le sel est l’ennemi discret. Il se dépose en poudre fine sur les cadres et ronge les dorures. Une fois par semaine, on dépoussière au pinceau doux, jamais au chiffon. Les œuvres sur papier dorment à plat, entre deux feuilles neutres, dans des tiroirs de cèdre.') },
      { p: fr('Enfin, nous déconseillons de vernir une toile récente : le vernis emprisonne l’humidité. Un collectionneur pressé reste le seul vrai danger.') },
    ],
  },
  {
    no: '11',
    genre: 'Entretien',
    lecture: '3 min',
    date: 'Novembre 2025',
    titre: fr('Trois questions à Sophie Dérose'),
    dek: fr('Photographier la côte sans la trahir. Entretien sur la plage, marée descendante.'),
    image: 'horizons',
    legende: fr('« Horizons, série plage », Sophie Dérose, 2024.'),
    corps: [
      { q: fr('Pourquoi l’argentique ?'), p: fr('Parce qu’il faut choisir. Douze vues par rouleau, ce sont douze décisions. Le numérique m’aurait laissée photographier la mer ; l’argentique m’oblige à l’attendre.') },
      { q: fr('Pourquoi à hauteur d’enfant ?'), p: fr('C’est la hauteur à laquelle j’ai vu cette plage pour la première fois. De là, l’horizon coupe le ciel plus haut, et la mer paraît immense. Je n’ai jamais voulu la rendre plus petite.') },
      { q: fr('Que cherchez-vous à marée basse ?'), p: fr('Le moment où le sable devient une page blanche. Il dure quelques minutes. Après, les pêcheurs tirent les canots, les enfants arrivent, et la plage redevient une rue. C’est très bien aussi, mais c’est une autre photographie.') },
    ],
  },
]
