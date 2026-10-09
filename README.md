# Gallerie d’art de Jacmel — « La maison aux persiennes »

Site de la galerie : on ouvre les persiennes, la lumière réelle de Jacmel entre, les œuvres sont au mur.
Vite + React 19 + TypeScript, `motion` pour le mouvement, `lenis` pour le défilement.

```bash
npm install
npm run dev        # http://localhost:5173 (génère d’abord les images)
npm test           # soleil, horaires, typographie
npm run build      # build de production (base /gallerie-d-art-jacmel/ pour GitHub Pages)
```

## Remplacer les photographies

Toutes les images partent de `assets/photos/<slug>.jpg`. Au `dev` et au `build`, `scripts/build-images.mjs`
fabrique les versions web (AVIF + WebP, 640/1280/2048 px, aperçu flou) dans `public/img/gen/`.

1. Déposez votre photo dans `assets/photos/` **sous le même nom** que celle qu’elle remplace
   (ex. `baie.jpg` pour « Lumière sur la baie »), ou avec un nouveau nom.
2. Nouveau nom ? Mettez à jour le champ `image` dans `src/content/artworks.ts` (œuvres),
   `src/content/artists.ts` (ateliers) ou `src/content/journal.ts` (carnets).
3. Œuvre : vérifiez `hCm` × `lCm` (hauteur × largeur réelles, en cm) — l’accrochage et la vue
   « À l’échelle » en dépendent, et le ratio doit correspondre à la photo.
4. `npm run images` (ou relancez `npm run dev`).
5. Retirez la ligne correspondante de `src/content/credits.ts` si l’image Wikimedia n’est plus utilisée.

`npm run photos:fetch` retélécharge les photographies Wikimedia Commons d’origine (crédits et licences
dans `src/content/credits.ts`, affichés dans le colophon).

## Contenu

- `src/content/artworks.ts` : les huit pièces, les quatre salles et leurs textes.
- `src/content/site.ts` : adresse, exposition, manifeste, accès.
- `src/lib/jacmel.ts` : horaires d’ouverture (et ce que l’en-tête en dit).
- `src/lib/sun.ts` : position du soleil au-dessus de Jacmel (lumière, ombres, thème de nuit).

## Mouvement réduit

Le site respecte la préférence « réduire les animations » du système (sous Windows : Paramètres >
Accessibilité > Effets visuels > Effets d’animation). Dans ce cas, les persiennes s’effacent au lieu de
s’ouvrir et les révélations sont immédiates. Pour montrer le mouvement complet quand même, ajoutez
`?motion=full` à l’adresse (mémorisé pour l’onglet).
