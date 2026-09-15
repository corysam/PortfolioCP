import { afterEach, vi } from "vitest";

// Ce fichier de setup s'applique à TOUS les tests, y compris ceux qui tournent
// en environnement "node" (lib/content.ts) où `window` n'existe pas :
// tout ce qui touche au DOM est donc conditionnel.
const isDom = typeof window !== "undefined";

if (isDom) {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);

  // jsdom n'implémente pas ces APIs, dont dépendent Motion (whileInView)
  // et Laboratory (IntersectionObserver / ResizeObserver / matchMedia).
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", NoopObserver);
  vi.stubGlobal("ResizeObserver", NoopObserver);

  if (!window.matchMedia) {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList
    );
  }

  // Utilisé par Navbar.go() et Hero.scrollDown().
  Element.prototype.scrollIntoView = vi.fn();
}
