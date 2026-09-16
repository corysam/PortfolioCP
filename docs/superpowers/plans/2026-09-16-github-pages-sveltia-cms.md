# GitHub Pages + Sveltia CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the static export to GitHub Pages via Actions, and add a Sveltia CMS admin page that edits the existing `content/` files in place.

**Architecture:** Three independent deliverables. Task 1 reshapes three JSON files on disk so a CMS `file collection` can address them, absorbing the change entirely inside `lib/content.ts` so domain types and components stay untouched. Task 2 adds the deploy workflow. Task 3 adds the two static admin files. Tasks 2 and 3 do not depend on each other; both are easier to verify once Task 1 is green.

**Tech Stack:** Next.js 16 (`output: "export"`), React 19, Tailwind 4, Vitest 5, GitHub Actions, Sveltia CMS (CDN, no build step).

**Spec:** `docs/superpowers/specs/2026-09-16-github-pages-sveltia-cms-design.md`

## Global Constraints

- **Node 24** — pinned in `.nvmrc`. The local shell default is v20, where Vitest fails with a misleading `styleText` error. Run `nvm use` before any `npm test` in a fresh shell.
- **The JSON envelope is a storage detail.** It must not reach `lib/types.ts`. Loaders normalize on read and keep returning the existing domain types.
- **`lib/types.ts`, `tests/fixtures.ts`, `components/Laboratory.tsx`, `components/Stack.tsx`, `components/Recommendations.tsx`, `app/page.tsx` and `scripts/check-content.mjs` must not be modified.** If a task seems to require touching them, the envelope has leaked into the domain — stop and re-read the spec.
- **Test assertions on loader return values must not change.** Only the JSON written into the temp fixtures changes shape. This is the signal that the constraint above held.
- **`npm run check:content` stays out of CI.** It exits 1 on the remaining lorem ipsum by design.
- Repo will be renamed to `corysam/corysam.github.io`; the site is served at the root, so **never add a `basePath`**.
- French is the language of the repo's comments, docs and CMS labels.

---

### Task 1: JSON storage envelopes absorbed by the loaders

**Files:**
- Modify: `content/stack.json` (whole file)
- Modify: `content/recommendations.json` (whole file)
- Modify: `content/lab.json` (the `edges` array only)
- Modify: `lib/content.ts:87-113` (`getLab`, `getStack`, `getRecommendations`, and the type import on line 7)
- Test: `tests/content.test.ts:163-219`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no signature changes. `getLab(projects, contentDir?) => Lab`, `getStack(contentDir?) => StackRow[]`, `getRecommendations(contentDir?) => Recommendation[]` all keep their current exported types. A private `LabFile` type is added inside `lib/content.ts` and is **not** exported.

- [ ] **Step 1: Rewrite the test fixtures to the new on-disk shape**

In `tests/content.test.ts`, change only the JSON strings passed to `makeContentDir`. Leave every `expect(...)` exactly as it is.

In `describe("getLab")`, the three `edges` values become objects:

```ts
        edges: [{ from: "n1", to: "n2" }],
```

```ts
        edges: [
          { from: "n1", to: "n1" },
          { from: "n1", to: "n99" },
        ],
```

```ts
        edges: [],
```

In `describe("loaders JSON")`, wrap the two root arrays:

```ts
      "stack.json": JSON.stringify({ rows: [{ label: "Back End", accent: "green", items: ["Node.js"] }] }),
      "recommendations.json": JSON.stringify({ items: [{ id: "r1", name: "Alice", role: "CTO", text: "Top." }] }),
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `nvm use && npx vitest run tests/content.test.ts`

Expected: FAIL. `getLab` throws or returns `[]` because `.filter(([a, b]) => ...)` destructures objects into `undefined`; `getStack(dir)[0]` is `undefined` because the parsed value is an object, not an array.

- [ ] **Step 3: Teach the loaders to unwrap**

In `lib/content.ts`, add `LabNode` to the type import on line 7:

```ts
import type { Lab, LabNode, Profile, Project, ProjectLink, Recommendation, StackRow } from "./types";
```

Add the storage type just above `getLab`:

```ts
// ---- Formes sur disque ----------------------------------------------------
// Le CMS ne sait pas éditer un tableau JSON racine ni un tuple : les fichiers
// portent une enveloppe. Elle s'arrête ici — les loaders renvoient les types
// du domaine, inchangés.

type LabFile = { nodes: LabNode[]; edges: { from: string; to: string }[] };
```

Replace the body of `getLab` (lines 87-105) with:

```ts
export function getLab(projects: Project[], contentDir: string = defaultContentDir()): Lab {
  const lab = readJson<LabFile>(contentDir, "lab.json");
  const projectIds = new Set(projects.map((p) => p.id));
  const nodeIds = new Set(lab.nodes.map((n) => n.id));

  for (const node of lab.nodes) {
    if (!projectIds.has(node.projectId)) {
      throw new Error(`content/lab.json : la bulle "${node.id}" référence un projet inconnu "${node.projectId}"`);
    }
  }
  // Une arête vers un id inconnu est ignorée (avec avertissement) au lieu de faire planter le rendu.
  const edges = lab.edges
    .map(({ from, to }) => [from, to] as [string, string])
    .filter(([a, b]) => {
      const valid = nodeIds.has(a) && nodeIds.has(b);
      if (!valid) console.warn(`content/lab.json : arête ignorée [${a}, ${b}] — id de bulle inconnu`);
      return valid;
    });

  return { nodes: lab.nodes, edges };
}
```

Replace `getStack` and `getRecommendations`:

```ts
export function getStack(contentDir: string = defaultContentDir()): StackRow[] {
  return readJson<{ rows: StackRow[] }>(contentDir, "stack.json").rows;
}

export function getRecommendations(contentDir: string = defaultContentDir()): Recommendation[] {
  return readJson<{ items: Recommendation[] }>(contentDir, "recommendations.json").items;
}
```

- [ ] **Step 4: Convert the three real content files**

`content/stack.json` — wrap the existing array in `{ "rows": ... }`, keeping all three categories (Back End / UX / UI / Front End) and their items verbatim.

`content/recommendations.json` — wrap the existing array in `{ "items": ... }`, keeping all four entries verbatim.

`content/lab.json` — keep `nodes` exactly as is; rewrite `edges` (note the existing file has a stray trailing space after the last entry — drop it):

```json
  "edges": [
    { "from": "n1", "to": "n2" },
    { "from": "n1", "to": "n3" },
    { "from": "n2", "to": "n3" },
    { "from": "n3", "to": "n4" },
    { "from": "n4", "to": "n5" },
    { "from": "n5", "to": "n2" }
  ]
```

- [ ] **Step 5: Run the full suite and the typecheck**

Run: `nvm use && npm run typecheck && npm run lint && npm test`

Expected: PASS, all suites. The `contenu réel du dépôt` test in `tests/content.test.ts` is what proves Step 4 was done — it calls `getStack()` and `getLab()` against the real `content/`.

- [ ] **Step 6: Verify the rendered page is unchanged**

Run: `nvm use && npm run build`

Expected: build succeeds. Confirm the Laboratory graph still has its six connecting lines:

```bash
grep -c '<line' out/index.html
```

Expected: `6`.

- [ ] **Step 7: Commit**

```bash
git add content/stack.json content/recommendations.json content/lab.json lib/content.ts tests/content.test.ts
git commit -m "Enveloppe les JSON de contenu pour les rendre éditables par le CMS

stack.json et recommendations.json passent d'un tableau racine à { rows } /
{ items }, et les arêtes de lab.json de tuples à { from, to } : trois formes
qu'une file collection Decap/Sveltia ne sait pas adresser autrement.

L'enveloppe s'arrête aux loaders de lib/content.ts, qui renvoient toujours
StackRow[], Recommendation[] et Lab — types, composants et fixtures de test
sont inchangés, et les assertions des tests non plus.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: GitHub Actions deploy to Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (the `## Déploiement` section)

**Interfaces:**
- Consumes: the `typecheck`, `lint`, `test` and `build` scripts already in `package.json`.
- Produces: nothing other tasks read.

- [ ] **Step 1: Create the workflow**

```yaml
name: Déploiement GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Un seul déploiement à la fois, sans annuler celui en cours.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci

      # Barrière : un contenu enregistré depuis le CMS qui casse le site
      # échoue ici plutôt qu'en production.
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

      - run: npm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Note: `npm run check:content` is deliberately absent — it exits 1 on the remaining placeholder content and would block every deploy.

- [ ] **Step 2: Validate the YAML parses**

Run:

```bash
nvm use && node -e "console.log(require('fs').readFileSync('.github/workflows/deploy.yml','utf8').length)" && npx --yes js-yaml .github/workflows/deploy.yml > /dev/null && echo "YAML OK"
```

Expected: `YAML OK`. If `js-yaml` is unavailable offline, skip this step — the workflow is validated for real by Step 4.

- [ ] **Step 3: Update the README deploy section**

Replace the body of `## Déploiement` in `README.md`. The current text says a web server must serve `out/`; that is no longer how the site ships.

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "Déploie sur GitHub Pages via Actions

Build et déploiement à chaque push sur main, avec typecheck, lint et tests
en barrière avant le build. check:content reste hors CI : il échoue tant
qu'il reste du contenu placeholder.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Sveltia CMS admin page

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`
- Modify: `README.md` (the `## Contenu` section)

**Interfaces:**
- Consumes: the on-disk shapes established by Task 1 — `{ rows }` in `stack.json`, `{ items }` in `recommendations.json`, `{ from, to }` edges in `lab.json`. **Task 1 must be complete before this task is verifiable.**
- Produces: nothing other tasks read.

- [ ] **Step 1: Create the admin page**

`public/admin/index.html` — the snippet from the Sveltia docs. Do not add a stylesheet link and do not add `type="module"`; the docs explicitly forbid both, because the script bundles its own styles.

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Portfolio — administration du contenu</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the CMS config**

`public/admin/config.yml`:

```yaml
# Sveltia CMS — édite directement les fichiers de content/ via l'API GitHub.
# Connexion : « Sign In with Token » avec un PAT fine-grained limité à ce dépôt.
# Aucun backend, aucun worker : le jeton ne vit que dans le navigateur.

backend:
  name: github
  repo: corysam/corysam.github.io
  branch: main

media_folder: public/projects
public_folder: /projects

collections:
  - name: projects
    label: Projets
    label_singular: Projet
    folder: content/projects
    extension: md
    create: true
    # Le nom de fichier est l'`id` que dérive lib/content.ts.
    identifier_field: name
    slug: "{{slug}}"
    fields:
      - { name: name, label: Nom, widget: string }
      - name: status
        label: Statut
        widget: select
        required: false
        options: ["Delivered", "In development"]
      - { name: role, label: Rôle, widget: string, required: false }
      - { name: order, label: Ordre d'affichage, widget: number, value_type: int, default: 999 }
      - { name: lab, label: Projet Laboratory, widget: boolean, default: false }
      - { name: description, label: Description courte, widget: text, required: false }
      - { name: mission, label: Mission, widget: text, required: false }
      - { name: problem, label: Problème, widget: text, required: false }
      - { name: method, label: Méthode, widget: text, required: false }
      - { name: result, label: Résultat, widget: text, required: false }
      - name: links
        label: Liens
        widget: list
        required: false
        fields:
          - { name: label, label: Libellé, widget: string }
          - { name: href, label: URL, widget: string }
      - name: images
        label: Images
        widget: list
        required: false
        field: { name: image, label: Image, widget: image }

  - name: site
    label: Contenu du site
    files:
      - name: profile
        label: Profil
        file: content/profile.json
        fields:
          - { name: name, label: Nom, widget: string }
          - { name: tagline, label: Accroche, widget: text }
          - { name: email, label: E-mail, widget: string }
          - { name: phone, label: Téléphone, widget: string }
          - { name: linkedin, label: LinkedIn, widget: string }
          - name: resume
            label: Chemin du CV dans public/ (ex. /resume.pdf)
            widget: string
            required: false
          - name: about
            label: Paragraphes « À propos »
            widget: list
            field: { name: paragraph, label: Paragraphe, widget: text }
          - name: expertises
            label: Expertises
            widget: list
            field: { name: item, label: Expertise, widget: string }

      - name: stack
        label: Stack
        file: content/stack.json
        fields:
          - name: rows
            label: Catégories
            widget: list
            fields:
              - { name: label, label: Catégorie, widget: string }
              - name: accent
                label: Couleur
                widget: select
                options: [green, cyan, yellow, red, violet]
              - name: items
                label: Technologies
                widget: list
                field: { name: item, label: Technologie, widget: string }

      - name: recommendations
        label: Recommandations
        file: content/recommendations.json
        fields:
          - name: items
            label: Témoignages
            widget: list
            fields:
              - { name: id, label: Identifiant, widget: string }
              - { name: name, label: Nom, widget: string }
              - { name: role, label: Rôle, widget: string }
              - { name: text, label: Texte, widget: text }

      - name: lab
        label: Laboratory
        file: content/lab.json
        fields:
          - name: nodes
            label: Bulles
            widget: list
            fields:
              - { name: id, label: Identifiant, widget: string }
              - { name: label, label: Libellé, widget: string }
              - { name: category, label: Catégorie, widget: string }
              - name: accent
                label: Couleur
                widget: select
                options: [green, cyan, yellow, red, violet]
              - { name: x, label: Position X (%), widget: number, value_type: int }
              - { name: y, label: Position Y (%), widget: number, value_type: int }
              - name: projectId
                label: Projet ouvert par la bulle
                widget: relation
                collection: projects
                search_fields: [name]
                display_fields: [name]
                value_field: "{{slug}}"
          - name: edges
            label: Liaisons entre bulles
            widget: list
            fields:
              - { name: from, label: De (identifiant de bulle), widget: string }
              - { name: to, label: Vers (identifiant de bulle), widget: string }
```

- [ ] **Step 3: Verify the config is valid YAML and ships into the export**

Run:

```bash
nvm use && npm run build && ls -l out/admin/
```

Expected: both `index.html` and `config.yml` are present in `out/admin/`. Next copies `public/` verbatim into the export.

- [ ] **Step 4: Confirm the admin page is excluded from the site's own routing**

Run:

```bash
grep -r "admin" out/index.html || echo "aucune référence — attendu"
```

Expected: `aucune référence — attendu`. The admin page is reachable only at `/admin/`, is marked `noindex`, and is not linked from the site.

- [ ] **Step 5: Update the README content section**

Append to the `## Contenu` section of `README.md`:

```markdown
### Éditer sans checkout

`/admin/` sert **Sveltia CMS** : une interface d'édition qui écrit directement
dans les fichiers ci-dessus via l'API GitHub, et déclenche donc le workflow de
déploiement comme n'importe quel commit.

La connexion se fait par **« Sign In with Token »**, avec un
[*fine-grained PAT*](https://github.com/settings/personal-access-tokens) limité
au seul dépôt `corysam.github.io` et disposant de la permission *Contents:
Read and write*. Le jeton ne vit que dans le navigateur — rien n'est stocké
dans le dépôt, et `public/admin/` ne contient aucun secret.

Les formes de `stack.json`, `recommendations.json` et des arêtes de `lab.json`
portent une enveloppe (`rows`, `items`, `{ from, to }`) pour que le CMS sache
les adresser. C'est un détail de stockage : `lib/content.ts` la retire à la
lecture et renvoie les mêmes types qu'avant.
```

- [ ] **Step 6: Commit**

```bash
git add public/admin/index.html public/admin/config.yml README.md
git commit -m "Ajoute Sveltia CMS pour éditer le contenu sans checkout

Deux fichiers statiques sous public/admin/, aucun backend : l'authentification
se fait par PAT fine-grained, donc sans worker Cloudflare ni app OAuth. Le CMS
écrit dans les mêmes fichiers content/ que les loaders lisent, ce qui garde la
décision réversible.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Manual steps (cannot be done from this machine)

These are the user's to perform, and Task 2 and Task 3 stay inert until they are:

1. Rename the repo `corysam/PortfolioCP` → `corysam/corysam.github.io` on GitHub. The old URL redirects automatically.
2. Locally: `git remote set-url origin git@github.com:corysam/corysam.github.io.git`
3. Repo settings → Pages → Source → **GitHub Actions**.
4. Create a fine-grained PAT scoped to that one repo with *Contents: Read and write*, for signing in at `/admin/`.

## End-to-end verification

After the branch is merged to `main` and the manual steps are done:

1. The Actions run is green and the `deploy` job reports a `page_url`.
2. `https://corysam.github.io/` renders identically to a local `npm run build` — check the project images load and the Laboratory graph draws its six lines.
3. `https://corysam.github.io/admin/` loads the CMS, accepts the PAT, and lists five collections: Projets, Profil, Stack, Recommandations, Laboratory.
4. Edit one field (for example the `tagline` in Profil), save, and confirm: a commit lands on `main`, the workflow reruns, and the change appears on the live site.
5. `npm run check:content` still reports the outstanding placeholder content — it is unaffected by the envelope change.
