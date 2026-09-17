// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

/*
 * Tailwind v4 résout `text-<x>` contre le namespace --text-* (taille) ET contre
 * --color-* (couleur). Un token de palette qui porte un nom de l'échelle de
 * tailles évince cette taille : `sm:text-base` devenait
 * `color: var(--color-base)`, donc du texte peint avec la couleur du fond.
 */
const FONT_SIZE_SCALE = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
];

const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

describe("palette du thème", () => {
  it("n'emprunte aucun nom à l'échelle de tailles de Tailwind", () => {
    const names = [...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]);

    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => FONT_SIZE_SCALE.includes(name))).toEqual([]);
  });
});
