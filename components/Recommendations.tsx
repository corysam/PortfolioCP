"use client";

import { motion } from "motion/react";
import { Section } from "./Section";
import type { Recommendation } from "@/lib/types";

export function Recommendations({ items }: { items: Recommendation[] }) {
  return (
    <Section id="recommandation" title="Recommandation">
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((r, i) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl border border-line bg-card p-6 text-center md:text-left"
          >
            <p className="text-xl text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {r.name}
            </p>
            <p className="mt-1 text-xs text-muted">{r.role}</p>
            <p className="mt-4 text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {r.text}
            </p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
