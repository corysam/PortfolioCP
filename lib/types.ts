// Types de contenu + helpers couleurs — importable côté client comme côté serveur.

export type ProjectStatus = "Delivered" | "In development";

export type ProjectLink = { label: string; href: string };

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  role: string;
  description: string;
  mission: string;
  problem: string;
  method: string;
  result: string;
  order: number;
  /** Projet du Laboratory : exclu de la grille "Project", ouvert via les bulles. */
  lab: boolean;
  links: ProjectLink[];
  images: string[];
};

export type AccentName = "green" | "cyan" | "yellow" | "red" | "violet";

export type LabNode = {
  id: string;
  label: string;
  category: string;
  accent: AccentName;
  x: number;
  y: number;
  projectId: string;
};

export type Lab = { nodes: LabNode[]; edges: [string, string][] };

export type StackRow = { label: string; accent: AccentName; items: string[] };

export type Recommendation = { id: string; name: string; role: string; text: string };

export type Profile = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  linkedin: string;
  /** Chemin vers le CV dans public/ (ex: "/resume.pdf") ou null pour masquer le bouton. */
  resume: string | null;
  about: string[];
  expertises: string[];
};

// ---- Couleurs d'accent : les valeurs vivent dans app/globals.css (@theme) ----

export const ACCENT_COLORS: Record<AccentName, string> = {
  green: "var(--color-status-green)",
  cyan: "var(--color-status-cyan)",
  yellow: "var(--color-status-yellow)",
  red: "var(--color-status-red)",
  violet: "var(--color-status-violet)",
};

/** Couleur dérivée du statut — une seule source de vérité (audit D2). */
export const STATUS_ACCENT: Record<ProjectStatus, AccentName> = {
  Delivered: "green",
  "In development": "cyan",
};

export const statusColor = (status: ProjectStatus) => ACCENT_COLORS[STATUS_ACCENT[status]];

/** Variante translucide d'une couleur (remplace les suffixes hex "55"/"14", audit D2). */
export const mix = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
