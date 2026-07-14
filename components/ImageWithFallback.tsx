"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

export function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [didError, setDidError] = useState(false);

  // L'état d'erreur suit la source : un échec passé ne condamne pas la suivante.
  useEffect(() => setDidError(false), [src]);

  if (didError) {
    return (
      <div className={`grid place-items-center bg-card text-muted ${className ?? ""}`}>
        <ImageOff size={28} aria-label={`Image indisponible : ${alt}`} />
      </div>
    );
  }

  // Export statique avec images non optimisées : <img> natif suffit ici.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setDidError(true)} />;
}
