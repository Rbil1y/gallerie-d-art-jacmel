// Crédits des photographies (Wikimedia Commons). Les fichiers ont été recadrés
// et compressés pour le web ; les adaptations restent sous la même licence.

export type Credit = { image: string; sujet: string; auteur: string; licence: string; licenceUrl: string; source: string }

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'
const BY2 = 'https://creativecommons.org/licenses/by/2.0/'
const BY4 = 'https://creativecommons.org/licenses/by/4.0/'
const BYSA3 = 'https://creativecommons.org/licenses/by-sa/3.0/'
const BYSA4 = 'https://creativecommons.org/licenses/by-sa/4.0/'

export const CREDITS: Credit[] = [
  { image: 'lasiren', sujet: 'Fer découpé haïtien', auteur: 'Alex Proimos', licence: 'CC BY 2.0', licenceUrl: BY2, source: `${COMMONS}Haitian_Metal_Art_(8321093754).jpg` },
  { image: 'kochon', sujet: 'Kanaval de Jacmel, 2014', auteur: 'HOPE Art', licence: 'CC BY 2.0', licenceUrl: BY2, source: `${COMMONS}Kanaval_in_Jacmel_Haiti_2014_10.jpg` },
  { image: 'masque', sujet: 'Kanaval de Jacmel, 2014', auteur: 'HOPE Art', licence: 'CC BY 2.0', licenceUrl: BY2, source: `${COMMONS}Kanaval_in_Jacmel_Haiti_2014_21.jpg` },
  { image: 'kanaval-visage', sujet: 'Kanaval de Jacmel, 2014', auteur: 'HOPE Art', licence: 'CC BY 2.0', licenceUrl: BY2, source: `${COMMONS}Kanaval_in_Jacmel_Haiti_2014_13.jpg` },
  { image: 'horizons', sujet: 'Mer, plage de Raymond-les-Bains', auteur: 'Rency Inson Michel', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Mer_plage_Raymond-les-bains.jpg` },
  { image: 'rade', sujet: 'Rade de Jacmel', auteur: 'Rency Inson Michel', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Rade_de_Jacmel.jpg` },
  { image: 'galerie-masques', sujet: 'Galerie d’œuvres, Jacmel', auteur: 'Rency Inson Michel', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Gall%C3%A9rie_d%27%C5%93uvre.jpg` },
  { image: 'canot', sujet: 'Canot de pêche, Jacmel', auteur: 'Nyou9117', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Canot_de_p%C3%AAche_-_Jacmel.jpg` },
  { image: 'masques-mur', sujet: 'Œuvres d’art, Jacmel', auteur: 'Nyou9117', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Oeuvres_d%27art_-_Jacmel.jpg` },
  { image: 'rue-conti', sujet: 'Maison, rue de Conti', auteur: 'Borrione', licence: 'CC BY-SA 4.0', licenceUrl: BYSA4, source: `${COMMONS}Jacmel-haiti.jpg` },
  { image: 'maison-boucard', sujet: 'Maison Boucard, rue du Commerce', auteur: 'Caribeanvybz', licence: 'CC BY 4.0', licenceUrl: BY4, source: `${COMMONS}Maison_Boucard_%C3%A0_Jacmel.jpg` },
  {
    image: 'jacmel-1904',
    sujet: 'Rue de Jacmel, 20 décembre 1904',
    auteur: 'G. M. Versteeg — Nationaal Museum van Wereldculturen',
    licence: 'CC BY-SA 3.0',
    licenceUrl: BYSA3,
    source: `${COMMONS}Collectie_Nationaal_Museum_van_Wereldculturen_RV-A103-1-246_%27Straat_te_Jacmel_(20_December)%27_Jacmel_G._M._(Gerard_Martinus)_Versteeg_(Fotograaf).jpg`,
  },
]
