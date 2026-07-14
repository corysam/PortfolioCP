import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Project } from "../data";
import { palette } from "../theme";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const rows = (p: Project) => [
  { label: "Mission", text: p.mission },
  { label: "Problem", text: p.problem },
  { label: "Method", text: p.method },
  { label: "Result", text: p.result },
];

const shots = [
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (project) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ backgroundColor: "rgba(5,8,22,0.7)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="my-auto w-full max-w-2xl rounded-3xl p-7 sm:p-9"
            style={{ backgroundColor: palette.bgAlt, border: `1px solid ${palette.border}`, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
          >
            <div className="flex items-start justify-between gap-4">
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
              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1, color: palette.white }}
                whileTap={{ scale: 0.9 }}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ color: palette.muted }}
                aria-label="Fermer"
              >
                <X size={18} />
              </motion.button>
            </div>

            <h2 className="mt-4 text-3xl" style={{ color: palette.text }}>
              {project.name}
            </h2>
            <p className="mt-1 text-sm" style={{ color: palette.muted }}>
              {project.role}
            </p>
            <div className="my-5 h-px w-full" style={{ backgroundColor: palette.borderSoft }} />

            <div className="flex flex-col gap-6">
              {rows(project).map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="grid gap-2 sm:grid-cols-[120px_1fr]"
                >
                  <p className="text-sm" style={{ color: palette.text, fontFamily: "var(--font-display)" }}>
                    {r.label}
                  </p>
                  <p className="text-sm" style={{ color: palette.muted, lineHeight: 1.6 }}>
                    {r.text}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {shots.map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="overflow-hidden rounded-2xl"
                  style={{ border: `1px solid ${palette.borderSoft}` }}
                >
                  <ImageWithFallback
                    src={src}
                    alt={`${project.name} aperçu ${i + 1}`}
                    className="aspect-[4/3] h-full w-full object-cover"
                  />
                </motion.div>
              ))}
            </div>

            {project.links && project.links.length > 0 && (
              <div className="mt-7 flex justify-center">
                <motion.a
                  href={project.links[0].href}
                  whileHover={{ y: -3, borderColor: palette.white, color: palette.white }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex rounded-full px-5 py-2.5 text-sm transition-colors"
                  style={{ border: `1px solid ${palette.borderSoft}`, color: palette.muted }}
                >
                  {project.links[0].label}
                </motion.a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
