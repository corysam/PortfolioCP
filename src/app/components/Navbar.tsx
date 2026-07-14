import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { navItems } from "../data";
import { palette } from "../theme";

export function Navbar() {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  // Met à jour l'onglet actif : on choisit la dernière section dont le haut
  // est passé sous le header. Fiable quelle que soit la hauteur des sections.
  useEffect(() => {
    const onScroll = () => {
      const line = 120; // hauteur sous le header servant de repère
      let current = navItems[0].id;
      for (const n of navItems) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= line) current = n.id;
      }
      // proche du bas de page : on force le dernier onglet
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = navItems[navItems.length - 1].id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "rgba(11,18,38,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${palette.borderSoft}`,
      }}
    >
      <nav className="relative mx-auto flex max-w-6xl items-center justify-center px-5 sm:px-8">
        {/* Tabs desktop répartis sur toute la largeur */}
        <ul className="hidden md:flex items-stretch justify-center gap-[70px]">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className="relative">
                <button
                  onClick={() => go(item.id)}
                  className="relative px-2 py-4 text-sm transition-colors duration-200"
                  style={{ color: isActive ? palette.white : palette.muted }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.color = palette.text)}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.color = palette.muted)}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-px"
                      style={{ backgroundColor: palette.white }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Mobile : seulement le bouton menu, aligné à droite */}
        <button
          className="md:hidden absolute right-5 top-1/2 -translate-y-1/2 rounded-md p-2"
          style={{ color: palette.text }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="md:hidden h-14" />
      </nav>

      {/* Menu mobile */}
      {open && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden overflow-hidden px-3 pb-3"
        >
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => go(item.id)}
                className="w-full px-4 py-3 text-left text-sm transition-colors"
                style={{ color: active === item.id ? palette.white : palette.muted }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </header>
  );
}
