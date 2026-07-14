"use client";

import { useEffect, useRef } from "react";
import { Section } from "./Section";
import { LabBubble } from "./LabBubble";
import type { Lab, Project } from "@/lib/types";

export function Laboratory({
  lab,
  projectsById,
  onOpen,
}: {
  lab: Lab;
  projectsById: Record<string, Project>;
  onOpen: (p: Project) => void;
}) {
  const { nodes, edges } = lab;
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);

  const open = (projectId: string) => {
    const project = projectsById[projectId];
    if (project) onOpen(project);
  };

  // Flottement des bulles + lignes qui les suivent, sans passer par le state
  // React (audit B2) : les transforms et attributs SVG sont mis à jour
  // directement, et uniquement quand la section est visible à l'écran.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));
    const offsets = nodes.map(() => ({ x: 0, y: 0 }));

    const applyFrame = (elapsed: number) => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      nodes.forEach((_, i) => {
        offsets[i].x = Math.sin(elapsed * 0.7 + i * 1.3) * 10;
        offsets[i].y = Math.cos(elapsed * 0.6 + i * 2.1) * 12;
        const el = nodeRefs.current[i];
        if (el) {
          el.style.transform = `translate(calc(-50% + ${offsets[i].x}px), calc(-50% + ${offsets[i].y}px))`;
        }
      });
      edges.forEach(([a, b], k) => {
        const line = lineRefs.current[k];
        const ia = nodeIndex.get(a);
        const ib = nodeIndex.get(b);
        // Arête vers une bulle inconnue : ignorée au lieu de planter (audit B4).
        if (!line || ia === undefined || ib === undefined) return;
        line.setAttribute("x1", String((nodes[ia].x / 100) * w + offsets[ia].x));
        line.setAttribute("y1", String((nodes[ia].y / 100) * h + offsets[ia].y));
        line.setAttribute("x2", String((nodes[ib].x / 100) * w + offsets[ib].x));
        line.setAttribute("y2", String((nodes[ib].y / 100) * h + offsets[ib].y));
      });
    };

    // Positionne lignes et bulles immédiatement (même sans animation).
    applyFrame(0);
    const ro = new ResizeObserver(() => applyFrame(0));
    ro.observe(container);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => ro.disconnect();
    }

    let raf = 0;
    let running = false;
    const start = performance.now();
    const tick = (t: number) => {
      applyFrame((t - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    // Le conteneur est en display:none sur mobile → jamais visible → pas de boucle.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(container);

    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [nodes, edges]);

  return (
    <Section id="laboratory" title="Laboratory">
      {/* Desktop : graphe de bulles connectées */}
      <div ref={containerRef} className="relative hidden h-[420px] w-full md:block">
        <svg className="absolute inset-0 h-full w-full">
          {edges.map(([a, b], k) => (
            <line
              key={`${a}-${b}`}
              ref={(el) => {
                lineRefs.current[k] = el;
              }}
              className="stroke-line"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {nodes.map((n, i) => (
          // wrapper : flottement en transform (GPU), aucune re-disposition
          <div
            key={n.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className="absolute will-change-transform"
            style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <LabBubble node={n} onClick={() => open(n.projectId)} whileHover={{ scale: 1.1 }} />
          </div>
        ))}
      </div>

      {/* Mobile : mêmes bulles, empilées et reliées verticalement */}
      <div className="flex flex-col items-center md:hidden">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex flex-col items-center">
            <LabBubble
              node={n}
              onClick={() => open(n.projectId)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.04 }}
              // décalage alterné droite / gauche pour casser l'alignement vertical
              style={{
                marginLeft: i % 2 === 0 ? "30%" : 0,
                marginRight: i % 2 === 0 ? 0 : "30%",
              }}
            />
            {/* ligne verticale entre chaque bulle */}
            {i < nodes.length - 1 && <span className="h-8 w-px bg-line" />}
          </div>
        ))}
      </div>
    </Section>
  );
}
