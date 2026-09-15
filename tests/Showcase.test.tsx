import { describe, expect, it } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Showcase } from "@/components/Showcase";
import { gridProject, lab, labProjectA, labProjectB } from "./fixtures";

const projects = [gridProject, labProjectA, labProjectB];

const renderShowcase = () => render(<Showcase projects={projects} lab={lab} />);

/**
 * Laboratory rend chaque bulle deux fois (desktop + mobile, séparés par CSS).
 * jsdom n'applique pas les media queries : on cible donc la première.
 */
const clickBubble = (name: RegExp) => userEvent.click(screen.getAllByRole("button", { name })[0]);

describe("Showcase", () => {
  it("exclut les projets de laboratoire de la grille Project", () => {
    renderShowcase();
    const grid = document.getElementById("project")!;

    expect(grid.textContent).toContain("Alpha");
    expect(grid.textContent).not.toContain("Lab A");
    expect(grid.textContent).not.toContain("Lab B");
  });

  it("ouvre la modale avec le projet de la carte cliquée", async () => {
    renderShowcase();

    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Alpha");
  });

  // Régression audit D3 : toutes les bulles ouvraient le même projet générique.
  it("chaque bulle ouvre SON propre projet", async () => {
    renderShowcase();

    await clickBubble(/Bulle A/);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(labProjectA.name);

    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    await clickBubble(/Bulle B/);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(labProjectB.name);
  });

  it("referme la modale avec Échap", async () => {
    renderShowcase();
    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    // AnimatePresence garde la modale montée pendant son animation de sortie.
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("n'affiche aucune modale au premier rendu", () => {
    renderShowcase();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
