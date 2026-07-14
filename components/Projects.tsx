"use client";

import { Section } from "./Section";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/types";

export function Projects({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  return (
    <Section id="project" title="Project">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} onOpen={onOpen} index={i} />
        ))}
      </div>
    </Section>
  );
}
