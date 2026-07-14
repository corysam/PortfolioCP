// Source unique de vérité pour les sections ET la navigation (audit D4) :
// un id de nav ne peut plus diverger d'un id de section.

export const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "project", label: "Project" },
  { id: "laboratory", label: "Labo" },
  { id: "stack", label: "Stack" },
  { id: "recommandation", label: "Recommandation" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
