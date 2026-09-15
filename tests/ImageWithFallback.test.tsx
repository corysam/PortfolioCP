import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

describe("ImageWithFallback", () => {
  it("affiche l'image tant qu'elle se charge", () => {
    render(<ImageWithFallback src="/ok.svg" alt="Aperçu" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/ok.svg");
  });

  it("bascule sur un placeholder quand l'image échoue", () => {
    render(<ImageWithFallback src="/ko.svg" alt="Aperçu" />);

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Image indisponible : Aperçu")).toBeInTheDocument();
  });

  // Régression audit U1 : l'état d'erreur restait collé au composant et
  // condamnait toute source ultérieure.
  it("réessaie quand la source change après un échec", () => {
    const { rerender } = render(<ImageWithFallback src="/ko.svg" alt="Aperçu" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(<ImageWithFallback src="/ok.svg" alt="Aperçu" />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "/ok.svg");
  });
});
