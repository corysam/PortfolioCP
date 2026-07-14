// Données mock du portfolio. Remplace librement par tes vrais contenus.

export type Project = {
  id: string;
  status: "Delivered" | "In development";
  statusColor: string;
  name: string;
  role: string;
  description: string;
  mission: string;
  problem: string;
  method: string;
  result: string;
  isLab?: boolean;
  links?: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    id: "p1",
    status: "Delivered",
    statusColor: "#34D399",
    name: "Aurora Dashboard",
    role: "Role Developer full stack",
    description:
      "Description courte du projet, ses enjeux et le contexte dans lequel il a été conçu. Une expérience pensée pour la performance.",
    mission:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.",
    problem:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.",
    method:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.",
    result:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.",
    links: [{ label: "Demo", href: "#" }, { label: "GitHub", href: "#" }],
  },
  {
    id: "p2",
    status: "In development",
    statusColor: "#38BDF8",
    name: "Nimbus CMS",
    role: "Role Front-end engineer",
    description:
      "Description courte du projet, ses enjeux et le contexte dans lequel il a été conçu. Une interface modulaire et rapide.",
    mission:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    problem:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    method:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    result:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    links: [{ label: "Demo", href: "#" }],
  },
  {
    id: "p3",
    status: "Delivered",
    statusColor: "#34D399",
    name: "Pulse Analytics",
    role: "Role Product designer & dev",
    description:
      "Description courte du projet, ses enjeux et le contexte dans lequel il a été conçu. De la donnée rendue lisible.",
    mission:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    problem:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    method:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    result:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    links: [{ label: "Demo", href: "#" }, { label: "Case study", href: "#" }],
  },
];

// Laboratory : bulles connectées (positions en % du conteneur).
// Chaque bulle = un projet du laboratoire avec sa catégorie colorée.
export type LabNode = {
  id: string;
  label: string; // titre du projet
  category: string; // catégorie associée
  color: string; // couleur de la catégorie
  x: number;
  y: number;
};
export const labNodes: LabNode[] = [
  { id: "n1", label: "Titre", category: "IA", color: "#A78BFA", x: 22, y: 28 },
  { id: "n2", label: "Titre", category: "Application", color: "#38BDF8", x: 30, y: 70 },
  { id: "n3", label: "Titre", category: "Application", color: "#38BDF8", x: 62, y: 60 },
  { id: "n4", label: "Titre", category: "Jeu vidéo", color: "#F87171", x: 78, y: 30 },
];

// Liens entre bulles (par id)
export const labEdges: [string, string][] = [
  ["n1", "n2"],
  ["n1", "n3"],
  ["n2", "n3"],
  ["n3", "n4"],
];

export const labProject: Project = {
  id: "lab1",
  status: "In development",
  statusColor: "#38BDF8",
  name: "Lab — Generative UI",
  role: "Exploration R&D",
  description: "Un terrain d'expérimentation autour des interfaces génératives.",
  isLab: true,
  mission:
    "Explorer comment des composants peuvent se recomposer dynamiquement selon le contexte utilisateur.",
  problem:
    "Les interfaces statiques peinent à s'adapter à la diversité des besoins et des appareils.",
  method:
    "Prototypage rapide, design tokens, et un moteur de layout réactif piloté par des règles.",
  result:
    "Un système de briques connectées, testable en temps réel, ouvrant la voie à de nouvelles démos.",
  links: [{ label: "Add Demo", href: "#" }],
};

export const stack = {
  "Back End": ["Node.js", "Express", "PostgreSQL", "Prisma", "Redis", "Docker"],
  "UX / UI": ["Figma", "Framer", "Design Systems", "Prototyping", "Motion"],
  "Front End": ["React", "TypeScript", "Tailwind", "Next.js", "Vite", "Motion"],
} as const;

export const recommendations = [
  {
    id: "r1",
    name: "Nom Prénom",
    role: "Role - Entreprise - Client",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum.",
  },
  {
    id: "r2",
    name: "Nom Prénom",
    role: "Role - Entreprise - Client",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum.",
  },
  {
    id: "r3",
    name: "Nom Prénom",
    role: "Role - Entreprise - Client",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum.",
  },
  {
    id: "r4",
    name: "Nom Prénom",
    role: "Role - Entreprise - Client",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum.",
  },
];

export const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "project", label: "Project" },
  { id: "laboratory", label: "Labo" },
  { id: "stack", label: "Stack" },
  { id: "recommandation", label: "Recommandation" },
];
