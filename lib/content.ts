// Loaders de contenu — build-time uniquement (fs n'existe pas côté navigateur).
// À n'importer que depuis des composants serveur (app/page.tsx).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Lab, Profile, Project, ProjectStatus, Recommendation, StackRow } from "./types";

/** Racine du contenu. Paramétrable pour permettre de tester sur des fixtures. */
const defaultContentDir = () => path.join(process.cwd(), "content");

const PROJECT_STATUSES: ProjectStatus[] = ["Delivered", "In development"];
const REQUIRED_PROJECT_FIELDS = [
  "name",
  "status",
  "role",
  "description",
  "mission",
  "problem",
  "method",
  "result",
] as const;

function readJson<T>(contentDir: string, file: string): T {
  return JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")) as T;
}

export function getProjects(contentDir: string = defaultContentDir()): Project[] {
  const dir = path.join(contentDir, "projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));

      for (const field of REQUIRED_PROJECT_FIELDS) {
        if (!data[field]) {
          throw new Error(`content/projects/${file} : champ frontmatter manquant "${field}"`);
        }
      }
      if (!PROJECT_STATUSES.includes(data.status)) {
        throw new Error(
          `content/projects/${file} : status "${data.status}" invalide (attendu : ${PROJECT_STATUSES.join(" | ")})`
        );
      }

      return {
        id,
        name: data.name,
        status: data.status,
        role: data.role,
        description: data.description,
        mission: data.mission,
        problem: data.problem,
        method: data.method,
        result: data.result,
        order: data.order ?? 999,
        lab: data.lab ?? false,
        links: data.links ?? [],
        images: data.images ?? [],
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
