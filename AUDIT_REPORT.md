# Repository Audit — PortfolioCP

**Date:** 2026-07-14 · **Scope:** `src/` + build/config files · **Auditor:** automated senior-engineer review
**Excluded:** `node_modules/`, `src/app/components/ui/` internals (stock shadcn/ui boilerplate — audited only for *usage*, not line-by-line).

---

## Architecture (10 lines)

1. Single-page React 18 portfolio site, generated from Figma Make, built with Vite 6 + Tailwind CSS 4 (`@tailwindcss/vite`).
2. Entry point: `index.html` → `src/main.tsx` → `src/app/App.tsx`; no router — one page, anchor-scroll navigation.
3. `App.tsx` composes fixed sections: Navbar, Hero, About, Projects, Laboratory, Stack, Recommendations, Footer, plus a `ProjectModal` overlay.
4. Only piece of app state: `active: Project | null` in `App.tsx`, set by `Projects`/`Laboratory` cards and cleared by the modal.
5. All content is static mock data in `src/app/data.ts` (projects, lab graph nodes/edges, stack, recommendations, nav items) — no API, no forms, no user input.
6. Theming: a hardcoded color object in `src/app/theme.ts` applied via inline `style` props; Tailwind utilities handle layout; fonts loaded from Google Fonts (`src/styles/fonts.css`).
7. Animation: `motion/react` (Framer Motion) for entrances/hover, plus a hand-rolled `requestAnimationFrame` loop in `Laboratory.tsx` for floating bubbles.
8. `src/app/components/ui/` contains ~46 shadcn/ui components — **none are imported by app code** (dead vendored boilerplate).
9. `vite.config.ts` adds a `figma:asset/` resolver (unused — `src/assets/` doesn't exist) and whitelists a public DuckDNS host for the dev server.
10. No tests, no tsconfig, no linter, no CI; `package.json` has only `dev` and `build` scripts; React itself is declared only as an *optional peer dependency* (pinned via lockfile).

---

## Executive Summary — Top 5 Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | **Vite dev server exposed to the public internet** (`allowedHosts: ['moviesreco.duckdns.org']`) while running Vite 6.3.5, which has known arbitrary-file-read vulnerabilities — remote attackers can read files off the dev machine | **Critical** |
| 2 | **~30 unused runtime dependencies + 46 unused shadcn components**, including `react-router@7.13.0` which carries a High-severity RCE-class advisory — huge attack/audit surface for zero benefit | **High** |
| 3 | **No type-checking, linting, or tests at all** — Vite strips TypeScript types without checking them; nothing catches regressions | **High** |
| 4 | **Clipboard copy silently fails but shows "Copié dans le presse-papier"** on any non-HTTPS or clipboard-blocked context (exactly how the site is served today) | **Medium** |
| 5 | **`Laboratory` re-renders its whole subtree ~60×/second forever** via `setState` inside a `requestAnimationFrame` loop, even when off-screen and on mobile where the animated graph is hidden | **Medium** |

---

## 1. BUGS

### B1 — False "copied to clipboard" confirmation
**Severity: Medium · Confidence: 9**
[Hero.tsx:22-43](src/app/components/Hero.tsx#L22-L43)

```ts
const copyValue = async (label: string, value: string) => {
  try {
    await navigator.clipboard?.writeText(value);
  } catch {
    // fallback ...
  }
  setCopied(label);   // always runs
```

**Why it's a problem:** `navigator.clipboard` is `undefined` in insecure contexts (plain HTTP — which is how a DuckDNS-fronted dev server is typically reached) and in many embedded webviews. With optional chaining, the expression evaluates to `undefined`, `await undefined` **resolves successfully**, so the `catch` fallback never runs — nothing is copied, yet the tooltip asserts "Copié dans le presse-papier" (line 144). The inner fallback's `catch {}` also swallows total failure and still reports success. Reproduce: open the site over `http://` (non-localhost), click the email icon, paste — clipboard is unchanged, UI says copied.

**Fix:** branch explicitly instead of optional-chaining, and only confirm on success:

```ts
let ok = false;
if (navigator.clipboard) {
  try { await navigator.clipboard.writeText(value); ok = true; } catch {}
}
if (!ok) ok = legacyExecCommandCopy(value); // returns boolean
setCopied(ok ? label : null); // or show an error state
```

---

### B2 — Full-tree re-render at animation frame rate, forever
**Severity: Medium · Confidence: 9**
[Laboratory.tsx:9-30](src/app/components/Laboratory.tsx#L9-L30)

```ts
const loop = (t: number) => {
  ...
  setOffsets(Array.from({ length: count }, (_, i) => ({ ... })));
  raf = requestAnimationFrame(loop);
};
```

**Why it's a problem:** `useFloatOffsets` calls `setState` on every animation frame for the lifetime of the page. Every frame re-renders `Laboratory` and all its motion buttons (~60 renders/sec), regardless of whether the section is in the viewport — and it also runs on mobile, where the animated desktop graph is `hidden` and the offsets are used for nothing. This is measurable constant CPU/battery drain and jank on low-end devices for a purely decorative effect.

**Fix:** drive the float without React state: use Motion `useMotionValue`/`animate` (or CSS keyframe animations) for the bubble transforms, and update the SVG `<line>` endpoints imperatively via refs in the same rAF. At minimum, gate the loop with an `IntersectionObserver` (pause when off-screen) and a `matchMedia("(min-width: 768px)")` check.

---

### B3 — Project links beyond the first are silently dropped
**Severity: Low · Confidence: 8**
[ProjectModal.tsx:128-140](src/app/components/ProjectModal.tsx#L128-L140)

```tsx
{project.links && project.links.length > 0 && (
  ...
  <motion.a href={project.links[0].href} ...>
    {project.links[0].label}
```

**Why it's a problem:** the data model supports multiple links and the data uses it — `p1` declares `Demo` + `GitHub`, `p3` declares `Demo` + `Case study` ([data.ts:35](src/app/data.ts#L35), [data.ts:71](src/app/data.ts#L71)) — but the modal renders only `links[0]`. The GitHub / Case-study links are unreachable anywhere in the UI. Once real URLs replace the `#` placeholders this becomes user-visible data loss.

**Fix:** `project.links.map(l => <motion.a key={l.label} href={l.href} ...>{l.label}</motion.a>)`.

---

### B4 — A bad edge id in `labEdges` crashes the entire app
**Severity: Low · Confidence: 7**
[Laboratory.tsx:53-57](src/app/components/Laboratory.tsx#L53-L57) and [Laboratory.tsx:64-66](src/app/components/Laboratory.tsx#L64-L66)

```ts
const px = (i: number) => ({ x: base(i).x + offsets[i].x, ... });
const indexOf = (id: string) => labNodes.findIndex((n) => n.id === id);
...
const pa = px(indexOf(a));
```

**Why it's a problem:** `indexOf` returns `-1` for an id not present in `labNodes`; `labNodes[-1]` / `offsets[-1]` are `undefined`, so `px(-1)` throws `TypeError: Cannot read properties of undefined`. `data.ts` is explicitly meant to be hand-edited ("Remplace librement par tes vrais contenus"), there is no validation, and the app has no error boundary — one typo in `labEdges` ([data.ts:93-98](src/app/data.ts#L93-L98)) white-screens the whole site. Reproduce: change `["n3","n4"]` to `["n3","n5"]`.

**Fix:** filter edges to those whose both endpoints resolve (`const ia = indexOf(a); if (ia < 0 || ib < 0) return null;`), and add a top-level React error boundary so content typos can't blank the page.

---

## 2. SECURITY

### S1 — Publicly exposed Vite dev server on a vulnerable Vite version
**Severity: Critical · Confidence: 8**
[vite.config.ts:20-22](vite.config.ts#L20-L22)

```ts
server: {
  allowedHosts: ['moviesreco.duckdns.org'],
},
```

**Why it's a problem:** `allowedHosts` with a public DuckDNS name only exists to serve the **dev server** through an internet-reachable hostname (it defeats Vite's DNS-rebinding/host-check protection for that host). The pinned Vite `6.3.5` is flagged by `npm audit` (run during this audit, 2 high findings) with, among others, **GHSA-p9ff-h696-f583 — "Arbitrary File Read via Vite Dev Server WebSocket"** plus several `server.fs.deny` bypasses (GHSA-jqfw-vq24-v9c3, GHSA-4w7w-66w2-5vf9, GHSA-g4jq-h2w9-997c).

**Concrete attack path:** attacker browses to `http://moviesreco.duckdns.org` → hits the Vite dev middleware/WebSocket (no authentication by design) → uses the file-read vulnerabilities to read arbitrary files on the developer's machine (`~/.ssh/id_rsa`, `.env` files of *other* projects, browser profiles). Even on a fully patched Vite, a dev server serves your entire source tree via `/@fs/` and is explicitly not hardened for public exposure — the Vite docs say never to expose it.

**Fix:**
1. Remove `allowedHosts` and stop tunneling the dev server through DuckDNS.
2. Deploy with `vite build` + a static host (or `vite preview` behind the proxy for demos).
3. Upgrade Vite to ≥ 6.4.3 regardless (`npm audit fix`).

---

### S2 — Vulnerable `react-router@7.13.0` in the dependency tree (unused)
**Severity: Medium · Confidence: 9**
[package.json:59](package.json#L59)

```json
"react-router": "7.13.0",
```

**Why it's a problem:** `npm audit` flags this version with seven advisories including **GHSA-49rj-9fvp-4h2h (unauthenticated RCE via turbo-stream deserialization, High)**. No app code imports `react-router` (verified by grep), so there is **no exploitable path today** — which is exactly why it should be deleted rather than upgraded: it's pure attack surface, install weight, and a permanent red flag in every future scan. The same applies to the ~30 other unused dependencies (see M1); any of them can pick up an advisory at any time.

**Fix:** remove `react-router` (and the rest of the unused dependency set) from `package.json`; reinstall to regenerate the lockfile.

---

### S3 — Third-party runtime origins (Google Fonts, Unsplash)
**Severity: Low · Confidence: 8**
[fonts.css:1](src/styles/fonts.css#L1), [ProjectModal.tsx:15-18](src/app/components/ProjectModal.tsx#L15-L18)

```css
@import url('https://fonts.googleapis.com/css2?family=Tomorrow...');
```
```ts
const shots = ["https://images.unsplash.com/photo-1551650975-...", ...];
```

**Why it's a problem:** every visitor's IP/user-agent is sent to Google and Unsplash on page load (a GDPR concern for an EU-hosted personal site — German courts have fined Google-Fonts hotlinking specifically), and the hero content of the modal depends on a third party staying up and keeping those URLs stable. `ImageWithFallback` mitigates total breakage but shows a grey placeholder.

**Fix:** self-host the two fonts (`@fontsource/tomorrow`, `@fontsource/red-hat-display`) and place project screenshots in `src/assets/` (the `figma:asset` resolver in `vite.config.ts` already anticipates this directory).

---

## 3. MAINTAINABILITY

### M1 — ~46 dead components and ~30 unused dependencies
**Severity: High · Confidence: 9**
[src/app/components/ui/](src/app/components/ui/), [package.json:10-66](package.json#L10-L66)

**Why it's a problem:** grep confirms **zero** imports of `components/ui/*` from app code, and zero imports of `@mui/*`, `@emotion/*`, `recharts`, `react-dnd`, `react-router`, `react-hook-form`, `react-slick`, `embla-carousel-react`, `cmdk`, `date-fns`, `canvas-confetti`, `input-otp`, `react-day-picker`, `vaul`, `sonner`, most `@radix-ui/*`, etc. This inflates `node_modules` (167 top-level packages), slows installs, produces false-positive audit noise (S2 is one), and makes every future dependency review 10× harder. The Figma Make export dumped its whole kitchen sink; none of it is load-bearing.

**Fix:** delete `src/app/components/ui/`, `src/app/components/figma/` stays (used by the modal), and trim `package.json` to what's actually imported: `react`, `react-dom`, `motion`, `lucide-react`, plus dev deps (`vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`). Build after each removal batch to confirm.

### M2 — No type-checking, no lint, no tests
**Severity: High · Confidence: 9**
Repository root (no `tsconfig.json`), [package.json:6-9](package.json#L6-L9)

```json
"scripts": { "build": "vite build", "dev": "vite" }
```

**Why it's a problem:** the codebase is TypeScript, but without a `tsconfig.json` Vite/esbuild only *strips* types — nothing ever checks them. The `Project` type contract between `data.ts` and four components, and hazards like B4, are exactly what `tsc --noEmit` would police. There is also no ESLint (would have flagged the DOM mutation in Navbar and hook deps) and no test of any critical path (modal open/close, nav scroll-spy).

**Fix (quick):** add a standard Vite React `tsconfig.json` (`strict: true`), add scripts `"typecheck": "tsc --noEmit"` and `"lint": "eslint src"`, wire both into `build` or CI. A couple of Vitest + Testing Library tests around `App` (open card → modal shows project → Escape closes) would cover the only real interaction.

### M3 — Stack section renders hardcoded empty circles; real stack data is dead code
**Severity: Medium · Confidence: 9**
[Stack.tsx:6-10](src/app/components/Stack.tsx#L6-L10) vs [data.ts:119-123](src/app/data.ts#L119-L123)

```ts
// Stack.tsx — what renders:
const rows = [{ label: "Back End", color: palette.green, count: 7 }, ...];
// data.ts — never imported by anyone:
export const stack = { "Back End": ["Node.js", "Express", ...], ... };
```

**Why it's a problem:** the component draws `count: 7` anonymous grey circles per row while the actual technology lists (6/5/6 items) sit unused in `data.ts` — counts don't even match, and labels have drifted (`"UX/UI"` vs `"UX / UI"`). Anyone updating their stack in `data.ts` (the file that says "replace with your real content") will see nothing change.

**Fix:** make `Stack.tsx` consume `stack` from `data.ts` (`Object.entries(stack)`), rendering one item per technology; delete the local `rows`.

### M4 — Duplicated markup: lab bubble ×2, status pill ×2
**Severity: Medium · Confidence: 9**
[Laboratory.tsx:95-118](src/app/components/Laboratory.tsx#L95-L118) vs [Laboratory.tsx:128-157](src/app/components/Laboratory.tsx#L128-L157); [ProjectCard.tsx:29-38](src/app/components/ProjectCard.tsx#L29-L38) vs [ProjectModal.tsx:60-69](src/app/components/ProjectModal.tsx#L60-L69)

**Why it's a problem:** the desktop and mobile bubble buttons are ~25 near-identical lines each (same dot, same two-line label, same colors) differing only in wrapper/animation props — a styling tweak must be made twice and will drift. The status pill (color + `55`/`14` alpha borders) is copy-pasted between card and modal.

**Fix:** extract `<LabBubble node={n} onOpen={...} />` and `<StatusPill status={...} color={...} />`.

### M5 — Placeholder/dead content shipped in the build
**Severity: Low · Confidence: 9**
[Hero.tsx:154](src/app/components/Hero.tsx#L154) (`href="#"` resume), [data.ts](src/app/data.ts) (lorem ipsum, `"Titre"`, `href: "#"` everywhere), [src/imports/](src/imports/) (two unreferenced PNGs), [index.html:8-10](index.html#L8-L10) (`<title>Ptf</title>`, `robots noindex,nofollow`)

**Why it's a problem:** expected for a work-in-progress, but three of these will silently sabotage a launch: the `noindex,nofollow` meta makes the portfolio invisible to search engines, the title "Ptf" is what appears in tabs/shares, and the "Download Resume" button navigates to `#` (scrolls to top, looks broken). The two `Desktop_-_*.png` files (~unreferenced by any import or CSS) are dead weight.

**Fix:** pre-launch checklist: real title/description, remove the robots meta, real resume URL (or hide the button), delete `src/imports/`, replace lorem ipsum.

### M6 — React declared as an *optional* peer dependency of an application
**Severity: Low · Confidence: 7**
[package.json:73-84](package.json#L73-L84)

```json
"peerDependencies": { "react": "18.3.1", "react-dom": "18.3.1" },
"peerDependenciesMeta": { "react": { "optional": true }, ... }
```

**Why it's a problem:** applications should declare their framework in `dependencies`. This install currently works only because `package-lock.json` happens to pin `react@18.3.1`; if the lockfile is ever regenerated (or the project switches to the declared pnpm workspace without the Figma toolchain), an "optional" peer may simply not be installed and the build fails with a missing module. It's a Figma Make artifact, not an intentional choice.

**Fix:** move `react` and `react-dom` to `dependencies`, delete the `peerDependencies*` blocks.

---

## 4. DESIGN FLAWS

### D1 — Three competing styling mechanisms, including direct DOM mutation
**Severity: Medium · Confidence: 8**
[Navbar.tsx:57-58](src/app/components/Navbar.tsx#L57-L58), plus pervasive inline `style={{ color: palette.x }}` across all components

```tsx
onMouseEnter={(e) => !isActive && (e.currentTarget.style.color = palette.text)}
onMouseLeave={(e) => !isActive && (e.currentTarget.style.color = palette.muted)}
```

**Why it's a problem:** colors are applied via (a) Tailwind classes (`text-[#8A90A8]` in [ProjectCard.tsx:41](src/app/components/ProjectCard.tsx#L41) — palette.muted hardcoded a fourth way), (b) inline `style` from `theme.ts`, and (c) imperative `element.style` mutation for hover, which bypasses React entirely — if React re-renders mid-hover, the mutated color is clobbered or sticks incorrectly, and the pattern breaks on touch/keyboard (no hover-out). Tailwind 4 is installed and already supports CSS-variable theming; the palette lives outside it, so utilities like `hover:` can't be used with brand colors.

**Fix:** define the palette once as CSS variables in `theme.css` mapped into Tailwind's `@theme`, then use classes (`text-muted hover:text-text`) everywhere; delete the `onMouseEnter/Leave` handlers.

### D2 — Colors denormalized into data; alpha via string concatenation
**Severity: Low · Confidence: 8**
[data.ts:22](src/app/data.ts#L22) (`statusColor: "#34D399"` per project), [ProjectCard.tsx:33-34](src/app/components/ProjectCard.tsx#L33-L34)

```tsx
border: `1px solid ${project.statusColor}55`,
backgroundColor: `${project.statusColor}14`,
```

**Why it's a problem:** every project stores a raw hex that merely re-encodes its `status` (`"Delivered"` is always `#34D399` = `palette.green`), so the status→color mapping is duplicated across data entries and can drift per item. The `+"55"`/`+"14"` alpha trick silently produces an invalid color if anyone supplies `rgb(...)`, a named color, or a 3-digit hex — the pill just loses its border with no error.

**Fix:** drop `statusColor` from the data; map in one place: `const statusColor = { Delivered: palette.green, "In development": palette.cyan }[status]`, and use `color-mix(in srgb, ${c} 33%, transparent)` (or an rgba helper) for the alpha variants.

### D3 — Every Laboratory bubble opens the same generic project
**Severity: Low · Confidence: 8**
[Laboratory.tsx:96](src/app/components/Laboratory.tsx#L96) and [Laboratory.tsx:129](src/app/components/Laboratory.tsx#L129) (`onClick={() => onOpen(labProject)}`), [data.ts:77-90](src/app/data.ts#L77-L90)

**Why it's a problem:** four visually distinct nodes with their own labels/categories all open the single shared `labProject` — the `LabNode` type has no link to a `Project`, so the data model cannot express "this bubble is this experiment". As soon as real lab content exists, the model has to change and both render paths (see M4) with it.

**Fix:** give `LabNode` a `project: Project` (or `projectId` resolved against a `labProjects` list) and pass `onOpen(n.project)`.

### D4 — Navigation and sections coupled by implicit string ids
**Severity: Low · Confidence: 7**
[data.ts:156-163](src/app/data.ts#L156-L163) vs the hardcoded `id` props in `App.tsx`'s children (e.g. [Section usage in Projects.tsx:7](src/app/components/Projects.tsx#L7), [Recommendations.tsx:8](src/app/components/Recommendations.tsx#L8) — `id="recommandation"`)

**Why it's a problem:** the scroll-spy and `scrollIntoView` in `Navbar.tsx` only work if each `navItems.id` exactly matches a section's hardcoded `id` string ("recommandation", "project"). Renaming either side compiles fine and fails silently (nav item never highlights, click does nothing). There's no single source of truth.

**Fix:** define sections as data (`{ id, label, Component }[]`) and derive both `navItems` and the rendered `<Section id>`s from it — a mismatch becomes impossible.

---

## Uncertain (confidence < 7)

### U1 — `ImageWithFallback` error state is sticky across `src` changes
**Severity: Low · Confidence: 6**
[ImageWithFallback.tsx:7-11](src/app/components/figma/ImageWithFallback.tsx#L7-L11)

`didError` is never reset when the `src` prop changes, so an instance that failed once shows the placeholder forever, even for a later valid `src`. With today's usage (static module-level `shots`, modal remounts via `AnimatePresence`) I could not construct a user-visible repro — it becomes real only if the component is reused with dynamic sources. Fix if kept: `useEffect(() => setDidError(false), [src])` or `key={src}` at call sites.

### U2 — Navbar scroll-spy never recalculates on window resize
**Severity: Low · Confidence: 6**
[Navbar.tsx:13-30](src/app/components/Navbar.tsx#L13-L30)

The active-tab calculation runs only on `scroll`. After a resize/orientation change (which reflows section positions) the highlighted tab can be stale until the next scroll event. Cosmetic and self-healing, hence uncertain. Fix: also listen to `resize`, or drive it with an `IntersectionObserver`.

---

## Remediation Roadmap

### Quick wins (hours, do first)
1. **Stop exposing the dev server** — remove `allowedHosts` from [vite.config.ts](vite.config.ts); serve `vite build` output statically behind the DuckDNS proxy instead. *(S1)*
2. **`npm audit fix` → Vite ≥ 6.4.3**, and delete `react-router` + the unused dependency block; verify with `npm run build`. *(S1, S2, M1 part 1)*
3. **Delete `src/app/components/ui/`** and `src/imports/*.png`. *(M1 part 2, M5)*
4. **Fix the clipboard flow** in [Hero.tsx](src/app/components/Hero.tsx) so the tooltip only confirms real success. *(B1)*
5. **Render all `project.links`** in [ProjectModal.tsx](src/app/components/ProjectModal.tsx); guard bad edge ids in [Laboratory.tsx](src/app/components/Laboratory.tsx). *(B3, B4)*
6. **Add `tsconfig.json` (strict) + `typecheck` script**; move react/react-dom to `dependencies`. *(M2, M6)*
7. **Pre-launch content pass**: title, remove `noindex`, resume link, self-hosted fonts. *(M5, S3)*

### Medium-term (1–2 days)
8. **Rework the Laboratory animation** off the React render loop (motion values or CSS animation + imperative SVG updates, paused off-screen). *(B2, D4-adjacent)*
9. **Wire `Stack.tsx` to the `stack` data**; extract `StatusPill` and `LabBubble`; add an error boundary around `App`. *(M3, M4, B4 hardening)*
10. **Add ESLint + 3–5 Vitest interaction tests** (modal open/close, nav scroll). *(M2)*

### Long-term refactors
11. **Consolidate styling**: palette → CSS variables in Tailwind `@theme`, replace inline styles and the Navbar DOM mutation with utility classes. *(D1, D2)*
12. **Data-model cleanup**: derive status colors from status, link lab nodes to real projects, drive sections/nav from one definition. *(D2, D3, D4)*

---

*Methodology: full read of all 14 app source files (~1,080 lines) plus configs; usage verified by grep (ui/ imports, dependency imports, asset references); dependency vulnerabilities verified with `npm audit` on the committed lockfile. The shadcn `ui/` folder was audited for usage only. No findings are reported inside test files (none exist — which is itself finding M2).*
