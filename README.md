# Portfolio — Clément Pellat

Site portfolio statique, construit avec **Next.js 16** (App Router, `output: "export"`),
**React 19**, **Tailwind CSS 4** et **Motion**. Tout le contenu vit dans `content/`
et est lu au moment du build : il n'y a ni base de données, ni API, ni serveur à l'exécution.

## Prérequis

**Node.js >= 22.12** (testé sur la LTS 24). La version est épinglée dans `.nvmrc` :

```bash
nvm use              # bascule sur la version du projet
```

## Démarrer

```bash
npm install
npm run dev          # serveur de développement
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build + export statique dans `out/` |
| `npm run typecheck` | `tsc --noEmit` (mode strict) |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run check:content` | Détecte le contenu encore *placeholder* (voir plus bas) |

## Déploiement

Le site est déployé sur **GitHub Pages** par `.github/workflows/deploy.yml`, à
chaque push sur `main`. Le workflow passe `typecheck`, `lint` et les tests avant
de builder : une modification de contenu qui casse le site échoue en CI plutôt
qu'en production.

Le dépôt est une *user page* (`corysam.github.io`), donc servi à la racine :
**aucun `basePath` n'est nécessaire**, et les chemins absolus (`/projects/...`,
`/resume.pdf`) fonctionnent tels quels.

Réglage à faire une fois, dans les paramètres du dépôt :
*Settings → Pages → Source → GitHub Actions*.

`npm run check:content` n'est volontairement pas dans le workflow : il sort en
code 1 tant qu'il reste du contenu placeholder, ce qui bloquerait tous les
déploiements. C'est un outil manuel d'avant-lancement.

Pour reproduire le build en local :

```bash
npm run build        # génère out/
```

Si `out/` est servi par un serveur web (ce n'est plus le cas en production),
il faut servir **ce dossier** — jamais le serveur de développement Next, qui
n'est pas prévu pour être exposé publiquement.

## Contenu

Tout se modifie dans `content/`, sans toucher au code :

| Fichier | Contenu |
|---|---|
| `content/projects/*.md` | Un fichier Markdown par projet (frontmatter) |
| `content/lab.json` | Bulles et liaisons de la section Laboratory |
| `content/stack.json` | Catégories et technologies |
| `content/recommendations.json` | Témoignages |
| `content/profile.json` | Identité, coordonnées, CV, texte « About » |

Le contenu est **validé au build** : un champ manquant, un `status` inconnu ou une
bulle pointant vers un projet inexistant fait échouer `npm run build` avec un message
explicite, plutôt que de casser la page en production. Une liaison (`edges`) vers une
bulle inconnue est simplement ignorée, avec un avertissement.

### Avant de publier

`npm run check:content` liste ce qui reste à finaliser : lorem ipsum, liens `href: "#"`,
libellés « Titre », images placeholder, CV absent, ou plusieurs bulles du Laboratory
qui ouvrent le même projet. Il sort en code 1 tant qu'il reste quelque chose — il n'est
volontairement **pas** branché sur `npm run build`, pour ne pas bloquer le développement.

## Tests

Vitest + Testing Library, en environnement jsdom (`tests/`).
Les tests couvrent surtout les régressions identifiées lors de l'audit :
confirmation de copie dans le presse-papier, rendu de **tous** les liens d'un projet,
tolérance aux liaisons invalides du Laboratory, cohérence entre `SECTIONS` et les
ancres réellement rendues, et ouverture/fermeture de la modale.

```bash
npm test
```

Les tests de composants s'appuient sur les fixtures de `tests/fixtures.ts`
et non sur `content/`, afin de rester verts quand le vrai contenu évolue.
