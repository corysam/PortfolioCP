import { motion } from "motion/react";
import { Section } from "./Section";
import { palette } from "../theme";

// Catégories : nom coloré + nombre de ronds
const rows: { label: string; color: string; count: number }[] = [
  { label: "Back End", color: palette.green, count: 7 },
  { label: "UX/UI", color: palette.cyan, count: 7 },
  { label: "Front End", color: palette.yellow, count: 7 },
];

export function Stack() {
  return (
    <Section id="stack" title="Stack">
      <div className="flex flex-col">
        {rows.map((row, r) => (
          <div key={row.label}>
            <div className="flex flex-col items-center gap-5 py-7 md:flex-row md:justify-between md:gap-4">
              <p className="text-base" style={{ color: row.color, fontFamily: "var(--font-display)" }}>
                {row.label}
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:justify-end">
                {Array.from({ length: row.count }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: r * 0.06 + i * 0.04, type: "spring", stiffness: 260, damping: 18 }}
                    whileHover={{ y: -6, scale: 1.08 }}
                    className="h-11 w-11 rounded-full sm:h-14 sm:w-14"
                    style={{ backgroundColor: "rgba(200,205,220,0.55)" }}
                  />
                ))}
              </div>
            </div>
            {/* ligne de séparation entre catégories */}
            {r < rows.length - 1 && (
              <div className="h-px w-full" style={{ backgroundColor: palette.borderSoft }} />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
