import { Section } from "./Section";
import { ProjectCard } from "./ProjectCard";
import { projects, Project } from "../data";

export function Projects({ onOpen }: { onOpen: (p: Project) => void }) {
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
