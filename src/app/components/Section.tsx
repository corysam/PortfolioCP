import { motion } from "motion/react";
import { ReactNode } from "react";
import { palette } from "../theme";

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-16 sm:py-24 scroll-mt-28">
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center text-2xl sm:text-3xl md:text-left"
          style={{ color: palette.text }}
        >
          {title}
        </motion.h2>
      )}
      {children}
    </section>
  );
}
