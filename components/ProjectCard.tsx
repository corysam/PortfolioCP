"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function ProjectCard({
  project,
  onOpen,
  index = 0,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  index?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(project)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full flex-col rounded-2xl border border-line bg-card p-6 text-left transition-colors hover:border-white hover:bg-card-hover"
    >
      <div className="flex items-center justify-between">
        <StatusPill status={project.status} />
        <ArrowUpRight
          size={18}
          // ml-auto : la flèche reste à droite même quand la pastille est absente.
          className="ml-auto text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
        />
      </div>

      {/* Un champ non renseigné n'affiche rien — pas un bloc vide avec ses marges. */}
      <h3 className="mt-5 text-xl text-ink">{project.name}</h3>
      {project.role && <p className="mt-1 text-sm text-muted">{project.role}</p>}
      {project.description && (
        <p className="mt-4 text-sm text-muted" style={{ lineHeight: 1.6 }}>
          {project.description}
        </p>
      )}
    </motion.button>
  );
}
