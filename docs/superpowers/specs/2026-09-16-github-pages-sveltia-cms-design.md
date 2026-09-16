# Déploiement GitHub Pages + édition de contenu via Sveltia CMS

**Date** : 2026-09-16
**Statut** : validé, prêt pour le plan d'implémentation

## Contexte

Le portfolio est un site entièrement statique : `next.config.ts` fixe
`output: "export"`, il n'y a ni route API, ni middleware, et `lib/content.ts`
ne lit le système de fichiers qu'au moment du build. Le résultat est un dossier
`out/` de fichiers plats.

Deux questions restaient ouvertes :

1. **Où l'héberger.** Le site était servi depuis un VPS Oracle free tier derrière
   un proxy DuckDNS. Pour un site sans rien de dynamique, ce VPS coûte de
   l'administration (nginx, renouvellement TLS, mises à jour système, instances
   ARM récupérées par Oracle quand elles sont inactives) sans rien apporter.
2. **Comment gérer le contenu.** Le contenu vit en Markdown + JSON dans
   `content/`. C'est le bon choix à cette échelle — 5 projets, ~200 lignes,
   versionné avec le code qui le rend, validé au build. Il manque seulement la
   possibilité d'éditer sans checkout local.

Le VPS ne sert plus le portfolio : il n'entre pas dans le périmètre.

## Décisions

| Décision | Choix | Pourquoi |
|---|---|---|
| Hébergement | GitHub Pages, **user page** | Renommer le dépôt en `corysam.github.io` le sert à la racine : aucun `basePath`, aucun chemin à réécrire. TLS et CDN gratuits, déploiement = `git push`. |
| CMS | **Sveltia CMS**, auth par PAT | Successeur maintenu de Decap. Écrit dans les mêmes fichiers `content/`, donc réversible. L'auth par *personal access token* ne demande **aucune infrastructure** : pas de Cloudflare Worker, pas de Netlify, pas d'app OAuth. |
| Forme des JSON | **Envelopper** les tableaux racine | Un tableau JSON racine ne s'exprime pas dans une `file collection`. L'enveloppe est un détail de stockage, absorbé par les loaders (voir ci-dessous). |
| VPS Oracle | Hors périmètre | Ne sert plus le portfolio. |

## Architecture

```
Sveltia (public/admin/) --commit--> main --> GitHub Actions --> Pages
       ^                                          |
       |                                          +-- npm ci
   navigateur + PAT                               +-- typecheck / lint / test  (bloquant)
                                                  +-- npm run build --> out/
                                                  +-- upload-pages-artifact + deploy-pages
```

Rien de nouveau à l'exécution. Le CMS est une page statique qui parle à l'API
GitHub depuis le navigateur ; le build reste exactement ce qu'il est aujourd'hui.

## Principe directeur : la forme du fichier est un détail de stockage

L'enveloppe JSON exigée par le CMS **ne doit pas remonter dans le domaine**.
Les loaders de `lib/content.ts` normalisent à la lecture et continuent de
renvoyer les types existants de `lib/types.ts`.

Conséquence — périmètre réel de la modification :

- `lib/content.ts` : les trois loaders déballent.
- `content/stack.json`, `content/recommendations.json`, `content/lab.json` : forme sur disque.
- `tests/content.test.ts` : les fixtures JSON écrites par les tests changent de forme ; **les assertions sur les valeurs renvoyées ne changent pas**.
- **Inchangés** : `lib/types.ts`, `tests/fixtures.ts`, `components/Stack.tsx`, `components/Recommendations.tsx`, `components/Laboratory.tsx`, `app/page.tsx`, `scripts/check-content.mjs`.

C'est la raison de ce principe : sans lui, `Lab.edges` changerait de type et
`components/Laboratory.tsx` (lignes 48 et 101, qui déstructurent `[a, b]`)
devrait suivre.

### Les trois formes

| Fichier | Avant | Après (sur disque) | Le loader renvoie toujours |
|---|---|---|---|
| `stack.json` | `[ {...} ]` | `{ "rows": [ {...} ] }` | `StackRow[]` |
| `recommendations.json` | `[ {...} ]` | `{ "items": [ {...} ] }` | `Recommendation[]` |
| `lab.json` → `edges` | `[["n1","n2"]]` | `[{ "from": "n1", "to": "n2" }]` | `[string, string][]` |

`getLab` garde son contrôle existant (`lib/content.ts:94`) — une bulle pointant
vers un projet inconnu lève ; une arête vers un id de bulle inconnu est ignorée
avec un avertissement.

## Composant 1 — Hébergement

**Renommage du dépôt.** `corysam/PortfolioCP` → `corysam/corysam.github.io` sur
GitHub (l'ancienne URL redirige automatiquement), puis `git remote set-url origin`
en local. Servi à la racine : les chemins `/projects/*.svg` du frontmatter et le
futur `/resume.pdf` de `lib/types.ts:56` fonctionnent sans changement.

**`.github/workflows/deploy.yml`** (nouveau) :

- Déclencheur : `push` sur `main`, plus `workflow_dispatch`.
- `actions/setup-node` avec `node-version-file: .nvmrc` — épingle Node 24. Le
  shell local est encore en v20, où Vitest échoue sur une erreur `styleText`
  trompeuse ; la CI ne doit pas hériter de ce piège.
- `npm ci`, puis **`npm run typecheck`, `npm run lint`, `npm test` en barrière**,
  puis `npm run build`.
- `actions/upload-pages-artifact` sur `out/`, puis `actions/deploy-pages`.
- Permissions `pages: write`, `id-token: write`, concurrence limitée à un
  déploiement à la fois.

**`check:content` reste hors de la barrière.** Il sort en code 1 sur chaque
chaîne lorem ipsum encore présente : le mettre dans la CI bloquerait tous les
déploiements. Il reste l'outil manuel d'avant-lancement que décrit son en-tête.

**Pas de `.nojekyll`.** `deploy-pages` ne passe pas par Jekyll : `_next/` survit.

**Réglage manuel** : dans les paramètres du dépôt, source Pages = *GitHub Actions*.

## Composant 2 — Sveltia CMS

Deux fichiers statiques, aucun backend.

**`public/admin/index.html`** — le snippet documenté : `<meta name="robots"
content="noindex">` et `<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js">`.
Ni feuille de style liée, ni `type="module"` : la doc l'interdit explicitement,
le JS embarque ses styles.

**`public/admin/config.yml`** :

- `backend: { name: github, repo: corysam/corysam.github.io, branch: main }`.
  Connexion via **« Sign In with Token »** avec un PAT *fine-grained* limité à ce
  seul dépôt.
- `media_folder: public/projects` / `public_folder: /projects` — correspond à la
  convention déjà utilisée par le frontmatter.
- Collections :
  - `projects` — *folder collection* sur `content/projects`, extension `md`. Le
    slug est le nom de fichier, c'est-à-dire l'`id` que dérive `lib/content.ts:65`.
    `status` en `select` sur `Delivered` / `In development` (les `KnownProjectStatus` de `lib/types.ts`, repris dans `KNOWN_STATUSES` de `scripts/check-content.mjs`) ; `order` en nombre ;
    `lab` en booléen ; `links` en liste `{label, href}` ; `images` en liste d'images.
  - `profile`, `stack`, `recommendations`, `lab` — *file collections* sur les
    JSON correspondants, avec les enveloppes décrites plus haut.
  - `accent` en `select` sur les cinq valeurs de `AccentName` ; `projectId` en
    `relation` vers `projects`, pour qu'une bulle ne puisse pas pointer vers un
    projet inexistant.

**Note de sécurité** : `public/admin/` est publié avec le site et lisible par
tous. C'est normal et sans risque — c'est une application côté client qui ne
contient aucun secret ; le PAT ne vit que dans le navigateur de l'éditeur.

## Vérification

1. `npm run typecheck && npm run lint && npm test` — la suite existante couvre
   les loaders (`tests/content.test.ts`) et doit passer **sans modification des
   assertions**, seules les fixtures JSON changent de forme. C'est le signal que
   le principe directeur a été respecté.
2. `npm run build` puis servir `out/` localement — la page doit être identique
   à avant (stack, recommandations et graphe Laboratory rendus).
3. Après le premier déploiement : ouvrir `https://corysam.github.io/`, vérifier
   que les images de projets et les assets `_next/` se chargent.
4. Ouvrir `https://corysam.github.io/admin/`, se connecter avec un PAT, modifier
   un champ, enregistrer — vérifier que le commit apparaît sur `main` et que le
   workflow redéploie.
5. `npm run check:content` — doit continuer à lister le contenu placeholder
   restant (il en reste : `profile.json` est encore en lorem ipsum).

## Hors périmètre

- Rédaction du contenu réel (le lorem ipsum de `content/` reste tel quel).
- Nom de domaine personnalisé.
- Toute modification du VPS Oracle.
