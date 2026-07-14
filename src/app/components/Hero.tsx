import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, Phone, Linkedin, Download, ChevronDown, Check } from "lucide-react";
import { palette } from "../theme";

type Social =
  | { Icon: typeof Mail; label: string; type: "copy"; value: string }
  | { Icon: typeof Mail; label: string; type: "link"; href: string };

const socials: Social[] = [
  { Icon: Mail, label: "Email", type: "copy", value: "hello@clementpellat.com" },
  { Icon: Phone, label: "Téléphone", type: "copy", value: "+33 6 00 00 00 00" },
  { Icon: Linkedin, label: "LinkedIn", type: "link", href: "https://www.linkedin.com/in/clement-pellat" },
];

export function Hero() {
  const [copied, setCopied] = useState<string | null>(null);

  const scrollDown = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Fallback si l'API Clipboard est bloquée (ex : iframe de prévisualisation)
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* ignore — on affiche quand même le tooltip avec la valeur */
      }
    }
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 2000);
  };

  return (
    <section
      id="home"
      className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 text-center sm:px-6 md:items-start md:text-left"
    >
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm"
        style={{ color: palette.muted }}
      >
        Hello I'm
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-2 text-5xl sm:text-7xl"
        style={{ color: palette.text, lineHeight: 1.05 }}
      >
        Clément Pellat
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12 }}
        className="mt-5 max-w-xl text-base sm:text-lg mx-auto md:mx-0"
        style={{ color: palette.muted }}
      >
        Je suis développeur expert en JavaScript, passionné par les interfaces
        soignées et les expériences interactives.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-7 flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-start"
      >
        <div className="flex items-center gap-3">
        {socials.map((s) => {
          const { Icon, label } = s;
          const hover = { y: -4, scale: 1.08, borderColor: palette.white, color: palette.white };
          const tap = { scale: 0.94 };
          const cls = "grid h-10 w-10 place-items-center rounded-full transition-colors";
          const st = { border: `1px solid ${palette.borderSoft}`, color: palette.muted };

          if (s.type === "link") {
            return (
              <motion.a
                key={label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={hover}
                whileTap={tap}
                className={cls}
                style={st}
              >
                <Icon size={18} />
              </motion.a>
            );
          }

          const isCopied = copied === label;
          return (
            <div key={label} className="group relative">
              <motion.button
                type="button"
                aria-label={label}
                onClick={() => copyValue(label, s.value)}
                whileHover={hover}
                whileTap={tap}
                className={cls}
                style={st}
              >
                <Icon size={18} />
              </motion.button>

              <AnimatePresence>
                {isCopied && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-2 text-xs"
                    style={{
                      backgroundColor: palette.bgAlt,
                      border: `1px solid ${palette.border}`,
                      color: palette.text,
                    }}
                  >
                    <span className="block" style={{ color: palette.text }}>{s.value}</span>
                    <span className="mt-0.5 flex items-center gap-1" style={{ color: palette.green }}>
                      <Check size={12} /> Copié dans le presse-papier
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        </div>

        <motion.a
          href="#"
          whileHover={{ y: -4, scale: 1.04, borderColor: palette.white, color: palette.white }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-colors md:ml-1"
          style={{ border: `1px solid ${palette.borderSoft}`, color: palette.muted }}
        >
          <Download size={16} />
          Download Resume
        </motion.a>
      </motion.div>

      {/* Flèche de scroll vers la section suivante */}
      <motion.button
        onClick={scrollDown}
        aria-label="Voir la suite"
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ color: palette.muted }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 0.6 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
        whileHover={{ color: palette.white, scale: 1.2 }}
      >
        <ChevronDown size={28} />
      </motion.button>
    </section>
  );
}
