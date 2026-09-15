import type { ProjectStatus } from "@/lib/types";
import { mix, statusColor } from "@/lib/types";

export function StatusPill({ status }: { status: ProjectStatus }) {
  // Statut non renseigné : pas de pastille vide (contenu en cours de rédaction).
  if (!status) return null;

  const color = statusColor(status);
  return (
    <span
      className="rounded-full px-3 py-1 text-xs"
      style={{
        color,
        border: `1px solid ${mix(color, 33)}`,
        backgroundColor: mix(color, 8),
      }}
    >
      {status}
    </span>
  );
}
