// @vitest-environment node
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLab, getProfile, getProjects, getRecommendations, getStack } from "@/lib/content";

const dirs: string[] = [];

/** Crée une arborescence content/ jetable et renvoie son chemin. */
function makeContentDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
  dirs.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, "utf8");
  }
  return dir;
}

const projectMd = (over: Record<string, unknown> = {}) => {
  const fields: Record<string, unknown> = {
    name: "Alpha",
    status: "Delivered",
    role: "Développeur",
    description: "Une description.",
    mission: "Une mission.",
    problem: "Un problème.",
    method: "Une méthode.",
    result: "Un résultat.",
    ...over,
  };
  const body = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${body}\n---\n`;
};

afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("getProjects", () => {
  it("trie les projets par 'order'", () => {
    const dir = makeContentDir({
      "projects/b.md": projectMd({ name: "B", order: 2 }),
      "projects/a.md": projectMd({ name: "A", order: 1 }),
      "projects/c.md": projectMd({ name: "C", order: 0 }),
    });
    expect(getProjects(dir).map((p) => p.name)).toEqual(["C", "A", "B"]);
  });

  it("déduit l'id du nom de fichier et applique les valeurs par défaut", () => {
    const dir = makeContentDir({ "projects/mon-projet.md": projectMd() });
    const [p] = getProjects(dir);
    expect(p.id).toBe("mon-projet");
    expect(p.lab).toBe(false);
    expect(p.links).toEqual([]);
    expect(p.images).toEqual([]);
    expect(p.order).toBe(999);
  });

  it("ignore les fichiers non-markdown", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd(),
      "projects/notes.txt": "pas un projet",
    });
    expect(getProjects(dir)).toHaveLength(1);
  });

  // Le contenu est édité à la main : une erreur doit casser le build, pas la page.
  it("échoue si un champ obligatoire manque", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ mission: undefined }) });
    expect(() => getProjects(dir)).toThrow(/champ frontmatter manquant "mission"/);
  });

  it("échoue si le status est invalide", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ status: "Shipped" }) });
    expect(() => getProjects(dir)).toThrow(/status "Shipped" invalide/);
  });
});

describe("getLab", () => {
  const projects = () => getProjects(makeContentDir({ "projects/lab-a.md": projectMd({ lab: true }) }));

  it("conserve les arêtes dont les deux extrémités existent", () => {
    const dir = makeContentDir({
      "lab.json": JSON.stringify({
        nodes: [
          { id: "n1", label: "A", category: "IA", accent: "violet", x: 0, y: 0, projectId: "lab-a" },
          { id: "n2", label: "B", category: "Jeu", accent: "red", x: 1, y: 1, projectId: "lab-a" },
        ],
        edges: [["n1", "n2"]],
      }),
    });
    expect(getLab(projects(), dir).edges).toEqual([["n1", "n2"]]);
  });

  // Régression audit B4 : une arête vers un id inconnu faisait planter toute la page.
  it("ignore une arête vers une bulle inconnue au lieu de planter", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dir = makeContentDir({
      "lab.json": JSON.stringify({
        nodes: [{ id: "n1", label: "A", category: "IA", accent: "violet", x: 0, y: 0, projectId: "lab-a" }],
        edges: [
          ["n1", "n1"],
          ["n1", "n99"],
        ],
      }),
    });

    const result = getLab(projects(), dir);

    expect(result.edges).toEqual([["n1", "n1"]]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("n99"));
  });

  it("échoue si une bulle référence un projet inexistant", () => {
    const dir = makeContentDir({
      "lab.json": JSON.stringify({
        nodes: [{ id: "n1", label: "A", category: "IA", accent: "violet", x: 0, y: 0, projectId: "fantome" }],
        edges: [],
      }),
    });
    expect(() => getLab(projects(), dir)).toThrow(/référence un projet inconnu "fantome"/);
  });
});

describe("loaders JSON", () => {
  it("lit stack, recommendations et profile", () => {
    const dir = makeContentDir({
      "stack.json": JSON.stringify([{ label: "Back End", accent: "green", items: ["Node.js"] }]),
      "recommendations.json": JSON.stringify([{ id: "r1", name: "Alice", role: "CTO", text: "Top." }]),
      "profile.json": JSON.stringify({ name: "Test", resume: null }),
    });
    expect(getStack(dir)[0].items).toEqual(["Node.js"]);
    expect(getRecommendations(dir)[0].name).toBe("Alice");
    expect(getProfile(dir).name).toBe("Test");
  });
});

describe("contenu réel du dépôt", () => {
  // Garde-fou : le contenu livré doit toujours passer la validation.
  it("content/ est valide", () => {
    const projects = getProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(() => getLab(projects)).not.toThrow();
    expect(getStack().length).toBeGreaterThan(0);
    expect(getProfile().name).toBeTruthy();
  });
});
