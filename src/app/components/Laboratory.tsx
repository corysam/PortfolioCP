import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Section } from "./Section";
import { labNodes, labEdges, labProject, Project } from "../data";
import { palette } from "../theme";

// Décalage de flottement (px) calculé en continu pour chaque bulle,
// afin que les lignes suivent exactement le mouvement des bulles.
function useFloatOffsets(count: number) {
  const [offsets, setOffsets] = useState(() =>
    Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  );
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const e = (t - start) / 1000;
      setOffsets(
        Array.from({ length: count }, (_, i) => ({
          x: Math.sin(e * 0.7 + i * 1.3) * 10,
          y: Math.cos(e * 0.6 + i * 2.1) * 12,
        }))
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count]);
  return offsets;
}

export function Laboratory({ onOpen }: { onOpen: (p: Project) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const offsets = useFloatOffsets(labNodes.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // position de base (statique) — sert au left/top et aux lignes
  const base = (i: number) => ({
    x: (labNodes[i].x / 100) * size.w,
    y: (labNodes[i].y / 100) * size.h,
  });
  // position animée (base + flottement) — utilisée par les lignes du svg
  const px = (i: number) => ({
    x: base(i).x + offsets[i].x,
    y: base(i).y + offsets[i].y,
  });
  const indexOf = (id: string) => labNodes.findIndex((n) => n.id === id);

  return (
    <Section id="laboratory" title="Laboratory">
      {/* Desktop : graphe de bulles connectées (sans fond ni zone centrale) */}
      <div ref={containerRef} className="relative hidden h-[420px] w-full md:block">
        <svg className="absolute inset-0 h-full w-full">
          {labEdges.map(([a, b]) => {
            const pa = px(indexOf(a));
            const pb = px(indexOf(b));
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={palette.border}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {labNodes.map((n, i) => {
          const b = base(i);
          return (
            // wrapper : flottement en transform (GPU), aucune re-disposition
            <div
              key={n.id}
              className="absolute"
              style={{
                left: b.x,
                top: b.y,
                transform: `translate(calc(-50% + ${offsets[i].x}px), calc(-50% + ${offsets[i].y}px))`,
                willChange: "transform",
              }}
            >
              <motion.button
                onClick={() => onOpen(labProject)}
                whileHover={{ scale: 1.1, borderColor: palette.white }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4"
                style={{
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-full"
                  style={{ backgroundColor: n.color, boxShadow: `0 0 16px ${n.color}88` }}
                />
                <span className="flex flex-col text-left leading-tight">
                  <span className="whitespace-nowrap text-xs" style={{ color: n.color }}>
                    {n.category}
                  </span>
                  <span className="-mt-0.5 text-sm" style={{ color: palette.text }}>
                    {n.label}
                  </span>
                </span>
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Mobile : mêmes bulles que desktop, empilées et reliées verticalement */}
      <div className="flex flex-col items-center md:hidden">
        {labNodes.map((n, i) => (
          <div key={n.id} className="flex flex-col items-center">
            <motion.button
              onClick={() => onOpen(labProject)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 1.2, ease: "easeOut" }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.04, borderColor: palette.white }}
              className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4"
              style={{
                backgroundColor: palette.bg,
                border: `1px solid ${palette.border}`,
                // décalage alterné droite / gauche pour casser l'alignement vertical
                marginLeft: i % 2 === 0 ? "30%" : 0,
                marginRight: i % 2 === 0 ? 0 : "30%",
              }}
            >
              <span
                className="h-7 w-7 shrink-0 rounded-full"
                style={{ backgroundColor: n.color, boxShadow: `0 0 16px ${n.color}88` }}
              />
              <span className="flex flex-col text-left leading-tight">
                <span className="whitespace-nowrap text-xs" style={{ color: n.color }}>
                  {n.category}
                </span>
                <span className="-mt-0.5 text-sm" style={{ color: palette.text }}>
                  {n.label}
                </span>
              </span>
            </motion.button>
            {/* ligne verticale entre chaque bulle */}
            {i < labNodes.length - 1 && (
              <span className="h-8 w-px" style={{ backgroundColor: palette.border }} />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
