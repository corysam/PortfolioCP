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
});

// Le contenu s'écrit au fil de l'eau : un projet à moitié rempli doit se charger
// (le champ vide ne s'affiche simplement pas), pas casser le build.
// `npm run check:content` reste le garde-fou qui signale ce qui manque.
describe("getProjects — contenu incomplet", () => {
  const emptyFrontmatter =
    "---\nname:\nstatus:\nrole:\ndescription:\nmission:\nproblem:\nmethod:\nresult:\nlinks:\nimages:\n---\n";

  it("charge un projet dont un champ est vide au lieu de planter", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ mission: "", problem: undefined }) });

    const [p] = getProjects(dir);

    expect(p.mission).toBe("");
    expect(p.problem).toBe("");
    expect(p.description).toBe("Une description.");
  });

  it("charge un projet dont le frontmatter est entièrement vide", () => {
    const dir = makeContentDir({ "projects/movies-reco.md": emptyFrontmatter });

    const [p] = getProjects(dir);

    expect(p.id).toBe("movies-reco");
    expect(p.status).toBe("");
    expect(p.role).toBe("");
    expect(p.mission).toBe("");
    expect(p.links).toEqual([]);
    expect(p.images).toEqual([]);
    expect(p.order).toBe(999);
    expect(p.lab).toBe(false);
  });

  // Une carte sans titre serait un rectangle vide impossible à identifier :
  // l'id du fichier sert de nom de repli.
  it("retombe sur l'id du fichier quand le nom est vide", () => {
    const dir = makeContentDir({ "projects/movies-reco.md": emptyFrontmatter });
    expect(getProjects(dir)[0].name).toBe("Movies Reco");
  });

  it("conserve un status hors liste au lieu de le rejeter", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ status: "Work in Progress" }) });
    expect(getProjects(dir)[0].status).toBe("Work in Progress");
  });

  it("normalise les valeurs en texte et retire les espaces superflus", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ role: "  Développeur  ", result: 42, method: null }),
    });

    const [p] = getProjects(dir);

    expect(p.role).toBe("Développeur");
    expect(p.result).toBe("42");
    expect(p.method).toBe("");
  });

  it("écarte les liens auxquels il manque un libellé ou une URL", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({
        links: [
          { label: "Demo", href: "https://example.com/demo" },
          { label: "GitHub" },
          { href: "https://example.com/orphelin" },
          { label: "  ", href: "  " },
        ],
      }),
    });

    expect(getProjects(dir)[0].links).toEqual([
      { label: "Demo", href: "https://example.com/demo" },
    ]);
  });

  it("écarte les images vides", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ images: ["/a.svg", "", null, "  "] }),
    });
    expect(getProjects(dir)[0].images).toEqual(["/a.svg"]);
  });

  it("ignore un 'order' non numérique plutôt que de casser le tri", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ name: "A", order: "pas un nombre" }),
      "projects/b.md": projectMd({ name: "B", order: 1 }),
    });
    expect(getProjects(dir).map((p) => p.name)).toEqual(["B", "A"]);
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
        edges: [{ from: "n1", to: "n2" }],
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
          { from: "n1", to: "n1" },
          { from: "n1", to: "n99" },
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
      "stack.json": JSON.stringify({ rows: [{ label: "Back End", accent: "green", items: ["Node.js"] }] }),
      "recommendations.json": JSON.stringify({ items: [{ id: "r1", name: "Alice", role: "CTO", text: "Top." }] }),
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
