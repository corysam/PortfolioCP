import { Heart } from "lucide-react";

export function Footer({ name }: { name: string }) {
  return (
    <footer className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-12 text-center">
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
        Developed with
        <Heart size={14} className="animate-pulse text-status-red fill-status-red" />
        by {name}
      </p>
    </footer>
  );
}
