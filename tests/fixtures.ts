import type { Lab, Profile, Project, Recommendation, StackRow } from "@/lib/types";

// Contenu de test volontairement indépendant de content/ : les tests doivent
// rester verts quand le vrai contenu du portfolio change.

export const makeProject = (over: Partial<Project> = {}): Project => ({
  id: "alpha",
  name: "Alpha",
  status: "Delivered",
  role: "Développeur",
  description: "Description d'Alpha.",
  mission: "Mission d'Alpha.",
  problem: "Problème d'Alpha.",
  method: "Méthode d'Alpha.",
  result: "Résultat d'Alpha.",
  order: 1,
  lab: false,
  links: [],
  images: [],
  ...over,
});

export const gridProject = makeProject({ id: "alpha", name: "Alpha" });

export const labProjectA = makeProject({
  id: "lab-a",
  name: "Lab A",
  lab: true,
  status: "In development",
});

export const labProjectB = makeProject({
  id: "lab-b",
  name: "Lab B",
  lab: true,
  status: "In development",
});

export const lab: Lab = {
  nodes: [
    { id: "n1", label: "Bulle A", category: "IA", accent: "violet", x: 20, y: 30, projectId: "lab-a" },
    { id: "n2", label: "Bulle B", category: "Jeu", accent: "red", x: 70, y: 60, projectId: "lab-b" },
  ],
  edges: [["n1", "n2"]],
};

export const profile: Profile = {
  name: "Test Person",
  tagline: "Tagline de test.",
  email: "test@example.com",
  phone: "+33 6 00 00 00 00",
  linkedin: "https://www.linkedin.com/in/test",
  resume: null,
  about: ["Paragraphe un.", "Paragraphe deux."],
  expertises: ["React", "Node.js"],
};

export const stack: StackRow[] = [
  { label: "Back End", accent: "green", items: ["Node.js", "Express"] },
  { label: "Front End", accent: "cyan", items: ["React"] },
];

export const recommendations: Recommendation[] = [
  { id: "r1", name: "Alice", role: "CTO", text: "Très bon travail." },
];

/** Projet tout juste créé : seul le fichier existe, aucun champ n'est rempli. */
export const emptyProject = makeProject({
  id: "movies-reco",
  name: "Movies Reco",
  status: "",
  role: "",
  description: "",
  mission: "",
  problem: "",
  method: "",
  result: "",
});
