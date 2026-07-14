"use client";

import { useMemo, useState } from "react";
import { Projects } from "./Projects";
import { Laboratory } from "./Laboratory";
import { ProjectModal } from "./ProjectModal";
import type { Lab, Project } from "@/lib/types";

// Seul état client de la page : le projet ouvert dans la modale,
// partagé entre la grille de projets et les bulles du Laboratory.
export function Showcase({ projects, lab }: { projects: Project[]; lab: Lab }) {
  const [active, setActive] = useState<Project | null>(null);

  const gridProjects = useMemo(() => projects.filter((p) => !p.lab), [projects]);
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  return (
    <>
      <Projects projects={gridProjects} onOpen={setActive} />
      <Laboratory lab={lab} projectsById={projectsById} onOpen={setActive} />
      <ProjectModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
