# World Cup Flags

Les drapeaux SVG utilisés par la page World Cup sont stockés ici :

- `public/images/flags/`

## Nouvelle logique de mapping API -> assets

L'API FIFA peut fournir des codes pays en **ISO3** (et parfois des trigrammes FIFA).  
Les assets front (`public/images/flags/*.svg`) sont nommés en **ISO2**.

La page `app/pages/event/world-cup/index.vue` passe désormais par l'utilitaire :

- `app/utils/countryCode.ts`
- fonction `iso3ToIso2(code3: string): string | null`

Flux appliqué :

1. Réception du code équipe (`team.code` / `teamCode`) depuis l'API.
2. Conversion en ISO2 via `iso3ToIso2`.
3. Construction du chemin `/images/flags/<iso2>.svg`.
4. Si la conversion échoue ou si l'image ne charge pas, fallback sur l'avatar texte existant.

## Équipes couvertes

Le mapping couvre toutes les équipes World Cup utilisées par la page (48 équipes), avec compléments FIFA utiles (ex: `ENG` -> `gb`, `GER` -> `de`, `NED` -> `nl`, `KSA` -> `sa`, `ALG` -> `dz`, `UAE` -> `ae`).

Codes ISO2 assets (48) :

`ae, ar, au, be, bo, br, ca, ci, cl, cm, co, cr, de, dk, dz, ec, eg, es, fr, gb, gh, hr, iq, ir, it, jp, kr, ma, mx, ng, nl, nz, pe, pl, pt, py, qa, rs, sa, se, sn, tn, tr, ua, us, uy, vi, za`
