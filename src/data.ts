export type Artwork = {
  id: string
  title: string
  artist: string
  year: string
  medium: string
  dims: string
  price: string
  img: string
  cat: 'peinture' | 'sculpture' | 'papier-mâché' | 'photographie'
  color: string
  provenance: string
  salle: string
  status: 'Disponible' | 'Réservée'
}

export const artworks: Artwork[] = [
  { id:'001', title:'Lumière sur la Baie', artist:'Jean-Baptiste Célestin', year:'2023', medium:'Acrylique sur toile', dims:'120 × 140 cm', price:'4 200 $', cat:'peinture', color:'#1A2A3A', img:'/img/art-baie.jpg', provenance:'Acquise directement de l’atelier, quartier du Bélé.', salle:'Salle 01 · Lumière', status:'Disponible' },
  { id:'002', title:'Masque du Kanaval', artist:'Atelier Morisset', year:'2024', medium:'Papier-mâché, pigment naturel', dims:'48 × 62 cm', price:'1 850 $', cat:'papier-mâché', color:'#C45A2B', img:'/img/k6.jpg', provenance:'Porté au défilé de février, kanaval 2014, rue du Baradères.', salle:'Salle 02 · Rite', status:'Disponible' },
  { id:'003', title:'Femme au regard bleu', artist:'Marie Lourdes Joseph', year:'2022', medium:'Huile et collage sur bois', dims:'80 × 100 cm', price:'3 600 $', cat:'peinture', color:'#2B3A2E', img:'/img/art-femme.jpg', provenance:'Peinte sur un bois de lit récupéré après le cyclone.', salle:'Salle 01 · Lumière', status:'Réservée' },
  { id:'004', title:'Totem Jacmel', artist:'Dimitri Benjamin', year:'2024', medium:'Bois flotté et fer forgé', dims:'180 × 45 cm', price:'5 900 $', cat:'sculpture', color:'#3A2A22', img:'/img/art-totem.jpg', provenance:'Bois ramassé à la sortie de la baie, fer d’une balconnière démolie.', salle:'Salle 03 · Matière', status:'Disponible' },
  { id:'005', title:'Marché en Couleurs', artist:'Lucien Saint-Vil', year:'2023', medium:'Acrylique sur toile', dims:'100 × 130 cm', price:'3 900 $', cat:'peinture', color:'#B85C3A', img:'/img/art-marche.jpg', provenance:'Vue du marché au fer, un samedi à sept heures.', salle:'Salle 01 · Lumière', status:'Disponible' },
  { id:'006', title:'Horizons, série plage', artist:'Sophie Dérose', year:'2024', medium:'Photographie argentique', dims:'60 × 90 cm', price:'1 200 $', cat:'photographie', color:'#1E3A4A', img:'/img/art-horizons.jpg', provenance:'Tirage 2 sur 7. Pellicule exposée à marée basse.', salle:'Salle 04 · Littoral', status:'Disponible' },
  { id:'007', title:'Esprit du Vaudou', artist:'Frankétienne Jr', year:'2021', medium:'Technique mixte sur toile', dims:'150 × 110 cm', price:'6 400 $', cat:'peinture', color:'#2A1E2F', img:'/img/art-esprit.jpg', provenance:'Déposée à la maison avant l’exposition de Montréal.', salle:'Salle 02 · Rite', status:'Réservée' },
  { id:'008', title:'Corail, mémoire', artist:'Atelier Morisset', year:'2024', medium:'Papier-mâché monumental', dims:'90 × 120 cm', price:'2 400 $', cat:'papier-mâché', color:'#8B3A2E', img:'/img/art-corail.jpg', provenance:'Commande de la maison. Séchage six semaines au soleil.', salle:'Salle 04 · Littoral', status:'Disponible' },
]

export const artists = [
  { name:'Jean-Baptiste Célestin', role:'Peintre', detail:'La lumière comme matière', since:'1996', img:'/img/p-celestin.jpg', bio:'Trente ans à peindre la même baie à six heures du matin. Rien d’autre ne l’intéresse.', works:'14 pièces au registre' },
  { name:'Atelier Morisset', role:'Papier-mâché', detail:'Quatre générations de masques', since:'1972', img:'/img/p-morisset.jpg', bio:'Une cour, trois fours à colle de manioc, et le kanaval comme calendrier.', works:'22 pièces au registre' },
  { name:'Sophie Dérose', role:'Photographe', detail:'L’archive sensible du littoral', since:'2015', img:'/img/p-derose.jpg', bio:'Argentique uniquement. La côte photographiée à hauteur d’enfant.', works:'9 pièces au registre' },
]

export const expo = {
  title:'Terre / Mer',
  dates:'12 oct. — 30 nov. 2026',
  line:'Huit pièces accrochées en une ligne, du bois flotté à la marée basse. Terre à gauche, mer à droite.',
}

export const manifesto = 'Nous n’exposons pas des objets haïtiens. Nous gardons des œuvres qui ont survécu au sel, à la lumière dure et au temps — et qui tiennent encore le mur, sans bruit.'

export const stats = [
  { n:'39', l:'ans de registre' },
  { n:'08', l:'pièces exposées' },
  { n:'03', l:'ateliers associés' },
  { n:'01', l:'rue à Jacmel' },
]

export const journal = [
  {
    no:'14',
    title:'Dans l’atelier Morisset, le papier devient masque',
    dek:'Cuisson de la colle de manioc, ponçage, première couche, et ce bleu qui ne s’invente pas. Photographié à six heures du matin, avant la chaleur.',
    meta:'Reportage',
    read:'12 min',
    date:'Février 2026',
    img:'/img/k4.jpg'
  },
  {
    no:'13',
    title:'Pourquoi Jacmel peint en bleu océan',
    dek:'Pigment, mer et embargo. Une histoire matérielle de la couleur, racontée par ceux qui la broient.',
    meta:'Essai',
    read:'8 min',
    date:'Janvier 2026',
    img:'/img/art-baie.jpg'
  },
  {
    no:'12',
    title:'Conserver une toile sous climat tropical',
    dek:'Température, sel, lumière. Nos protocoles de conservation, sans jargon et sans secret.',
    meta:'Carnet',
    read:'6 min',
    date:'Décembre 2025',
    img:'/img/art-esprit.jpg'
  },
  {
    no:'11',
    title:'Trois questions à Sophie Dérose',
    dek:'Photographier la côte sans la trahir. Entretien sur la plage, marée descendante.',
    meta:'Entretien',
    read:'4 min',
    date:'Novembre 2025',
    img:'/img/art-horizons.jpg'
  },
]

export const hours = [
  { d:'Mardi · Vendredi', h:'10 h — 18 h' },
  { d:'Samedi', h:'10 h — 19 h' },
  { d:'Dimanche', h:'10 h — 16 h' },
  { d:'Lundi', h:'Fermé' },
]

/** Ouvert / fermé, calculé à l’heure de Port-au-Prince. */
export function openState(now = new Date()): { open: boolean, label: string } {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone:'America/Port-au-Prince', weekday:'short', hour:'numeric', minute:'numeric', hour12:false,
  }).formatToParts(now)
  const get = (t:string) => parts.find(p=>p.type===t)?.value ?? ''
  const day = get('weekday').toLowerCase()
  const h = parseInt(get('hour'), 10)
  const isSunday = day.startsWith('dim')
  const isMonday = day.startsWith('lun')
  const isSaturday = day.startsWith('sam')
  if (isMonday) return { open:false, label:'Fermé · réouvre mardi 10 h' }
  if (isSunday) return h >= 10 && h < 16
    ? { open:true, label:'Ouvert · jusqu’à 16 h' }
    : { open:false, label:'Fermé · réouvre mardi 10 h' }
  if (isSaturday) return h >= 10 && h < 19
    ? { open:true, label:'Ouvert · jusqu’à 19 h' }
    : { open:false, label:h < 10 ? 'Fermé · ouvre à 10 h' : 'Fermé · réouvre dimanche 10 h' }
  return h >= 10 && h < 18
    ? { open:true, label:'Ouvert · jusqu’à 18 h' }
    : { open:false, label:h < 10 ? 'Fermé · ouvre à 10 h' : 'Fermé · réouvre demain 10 h' }
}
