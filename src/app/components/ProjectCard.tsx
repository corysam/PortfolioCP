import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Project } from "../data";
import { palette } from "../theme";

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
      whileHover={{ y: -8, borderColor: palette.white, backgroundColor: palette.cardHover }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full flex-col rounded-2xl p-6 text-left transition-colors"
      style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.card }}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs"
          style={{
            color: project.statusColor,
            border: `1px solid ${project.statusColor}55`,
            backgroundColor: `${project.statusColor}14`,
          }}
        >
          {project.status}
        </span>
        <ArrowUpRight
          size={18}
          className="text-[#8A90A8] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
        />
      </div>

      <h3 className="mt-5 text-xl" style={{ color: palette.text }}>
        {project.name}
      </h3>
      <p className="mt-1 text-sm" style={{ color: palette.muted }}>
        {project.role}
      </p>
      <p className="mt-4 text-sm" style={{ color: palette.muted, lineHeight: 1.6 }}>
        {project.description}
      </p>
    </motion.button>
  );
}
