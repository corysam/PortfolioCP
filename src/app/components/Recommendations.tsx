import { motion } from "motion/react";
import { Section } from "./Section";
import { recommendations } from "../data";
import { palette } from "../theme";

export function Recommendations() {
  return (
    <Section id="recommandation" title="Recommandation">
      <div className="grid gap-5 sm:grid-cols-2">
        {recommendations.map((r, i) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl p-6 text-center md:text-left"
            style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.card }}
          >
            <p className="text-xl" style={{ color: palette.text, fontFamily: "var(--font-display)" }}>
              {r.name}
            </p>
            <p className="mt-1 text-xs" style={{ color: palette.muted }}>
              {r.role}
            </p>
            <p className="mt-4 text-sm" style={{ color: palette.muted, lineHeight: 1.6 }}>
              {r.text}
            </p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
