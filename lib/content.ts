// Loaders de contenu — build-time uniquement (fs n'existe pas côté navigateur).
// À n'importer que depuis des composants serveur (app/page.tsx).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Lab, Profile, Project, ProjectLink, Recommendation, StackRow } from "./types";

/** Racine du contenu. Paramétrable pour permettre de tester sur des fixtures. */
const defaultContentDir = () => path.join(process.cwd(), "content");

function readJson<T>(contentDir: string, file: string): T {
  return JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")) as T;
}

// ---- Normalisation du frontmatter ----------------------------------------
// Un projet s'écrit au fil de l'eau : les champs absents deviennent des chaînes
// vides, que les composants n'affichent pas. `npm run check:content` reste le
// garde-fou qui signale ce qu'il reste à remplir, sans bloquer le build.

/** Champ de texte : `null`, absent ou non textuel → "". */
function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** "movies-reco" → "Movies Reco" : un nom de repli plutôt qu'une carte anonyme. */
function nameFromId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Seuls les liens ayant à la fois un libellé et une URL sont rendus. */
function toLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      label: text((entry as ProjectLink | null)?.label),
      href: text((entry as ProjectLink | null)?.href),
    }))
    .filter((link) => link.label !== "" && link.href !== "");
}

function toImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((src) => src !== "");
}

/** Un `order` absent ou illisible passe en fin de liste plutôt qu'en NaN. */
function toOrder(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 999;
}

export function getProjects(contentDir: string = defaultContentDir()): Project[] {
  const dir = path.join(contentDir, "projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));

      return {
        id,
        name: text(data.name) || nameFromId(id),
        status: text(data.status),
        role: text(data.role),
        description: text(data.description),
        mission: text(data.mission),
        problem: text(data.problem),
        method: text(data.method),
        result: text(data.result),
        order: toOrder(data.order),
        lab: data.lab === true,
        links: toLinks(data.links),
        images: toImages(data.images),
      } satisfies Project;
    })
    .sort((a, b) => a.order - b.order);
}

export function getLab(projects: Project[], contentDir: string = defaultContentDir()): Lab {
  const lab = readJson<Lab>(contentDir, "lab.json");
  const projectIds = new Set(projects.map((p) => p.id));
  const nodeIds = new Set(lab.nodes.map((n) => n.id));

  for (const node of lab.nodes) {
    if (!projectIds.has(node.projectId)) {
      throw new Error(`content/lab.json : la bulle "${node.id}" référence un projet inconnu "${node.projectId}"`);
    }
  }
  // Une arête vers un id inconnu est ignorée (avec avertissement) au lieu de faire planter le rendu.
  const edges = lab.edges.filter(([a, b]) => {
    const valid = nodeIds.has(a) && nodeIds.has(b);
    if (!valid) console.warn(`content/lab.json : arête ignorée [${a}, ${b}] — id de bulle inconnu`);
    return valid;
  });

  return { nodes: lab.nodes, edges };
}

export function getStack(contentDir: string = defaultContentDir()): StackRow[] {
  return readJson<StackRow[]>(contentDir, "stack.json");
}

export function getRecommendations(contentDir: string = defaultContentDir()): Recommendation[] {
  return readJson<Recommendation[]>(contentDir, "recommendations.json");
}

export function getProfile(contentDir: string = defaultContentDir()): Profile {
  return readJson<Profile>(contentDir, "profile.json");
}
