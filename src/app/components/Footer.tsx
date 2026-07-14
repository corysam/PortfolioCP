import { Heart } from "lucide-react";
import { palette } from "../theme";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-12 text-center">
      <p className="flex items-center justify-center gap-1.5 text-sm" style={{ color: palette.muted }}>
        Developed with
        <Heart size={14} className="animate-pulse" style={{ color: palette.red, fill: palette.red }} />
        by Clément Pellat
      </p>
    </footer>
  );
}
