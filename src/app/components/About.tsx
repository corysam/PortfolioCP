import { motion } from "motion/react";
import { palette } from "../theme";

const expertises = ["JavaScript", "React", "Node.js", "UX / UI", "Motion"];

export function About() {
  return (
    <section id="about" className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-20 sm:py-28 scroll-mt-24">
      <div className="grid gap-10 md:grid-cols-[380px_1fr] md:items-start">
        {/* Photo agrandie à gauche */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto aspect-[4/5] w-full max-w-[380px] rounded-xl md:mx-0"
          style={{ backgroundColor: "rgba(200,205,220,0.6)", border: `1px solid ${palette.borderSoft}` }}
        />

        {/* Colonne droite : titre collé à droite, puis texte, puis tags */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-md text-center md:ml-auto md:mr-0 md:text-right"
        >
          <h2 className="text-2xl sm:text-3xl" style={{ color: palette.text }}>
            About me
          </h2>

          <p className="mt-6 text-sm sm:text-base" style={{ color: palette.muted, lineHeight: 1.45 }}>
            Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper
            libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc blandit
            vel, luctus pulvinar, hendrerit id lorem.
          </p>
          <p className="mt-4 text-sm sm:text-base" style={{ color: palette.muted, lineHeight: 1.45 }}>
            Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut
            libero venenatis faucibus. Nullam quis ante etiam sit amet orci eget
            faucibus tincidunt.
          </p>
          <p className="mt-4 text-sm sm:text-base" style={{ color: palette.muted, lineHeight: 1.45 }}>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae
            ab illo inventore veritatis.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-end">
            {expertises.map((tag) => (
              <span
                key={tag}
                className="cursor-default rounded-full px-4 py-2 text-sm"
                style={{ border: `1px solid ${palette.border}`, color: palette.muted }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
