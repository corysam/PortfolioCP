#!/usr/bin/env node
// Garde-fou pré-lancement (audit M5 / D3) : détecte le contenu encore
// "placeholder" dans content/. Volontairement séparé de `npm run build` —
// le site doit rester constructible pendant la rédaction du contenu.
//
//   npm run check:content   → code de sortie 1 s'il reste des placeholders.

import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");
const findings = [];
const report = (file, message) => findings.push({ file, message });

const LOREM =
  /lorem ipsum|dolor sit amet|consectetur adipiscing|maecenas|suspendisse|nullam quis|sed ut perspiciatis|vestibulum/i;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

if (!fs.existsSync(contentDir)) {
  console.error("content/ introuvable");
  process.exit(1);
}

// 1. Texte lorem ipsum, quel que soit le fichier.
for (const file of walk(contentDir)) {
  const rel = path.relative(process.cwd(), file);
  const raw = fs.readFileSync(file, "utf8");
  raw.split("\n").forEach((line, i) => {
    if (LOREM.test(line)) report(rel, `ligne ${i + 1} : texte lorem ipsum`);
  });
  if (/href:\s*["']#["']|"href"\s*:\s*"#"/.test(raw)) {
    report(rel, 'lien placeholder href: "#"');
  }
  if (/\bTitre\b/.test(raw)) report(rel, 'libellé placeholder "Titre"');
  if (/placeholder-\d/.test(raw)) report(rel, "image placeholder");
}

// 2. Profil : CV et coordonnées.
const profilePath = path.join(contentDir, "profile.json");
if (fs.existsSync(profilePath)) {
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  if (!profile.resume) {
    report("content/profile.json", "resume: null — le bouton CV reste masqué");
  } else if (!fs.existsSync(path.join(process.cwd(), "public", profile.resume.replace(/^\//, "")))) {
    report("content/profile.json", `resume "${profile.resume}" introuvable dans public/`);
  }
  if (/^\+?[\d\s]*0{6,}/.test(String(profile.phone ?? "").replace(/\s/g, ""))) {
    report("content/profile.json", "numéro de téléphone factice");
  }
}

// 3. Laboratory : plusieurs bulles pointant vers le même projet (audit D3).
const labPath = path.join(contentDir, "lab.json");
if (fs.existsSync(labPath)) {
  const lab = JSON.parse(fs.readFileSync(labPath, "utf8"));
  const byProject = new Map();
  for (const n of lab.nodes ?? []) {
    byProject.set(n.projectId, [...(byProject.get(n.projectId) ?? []), n.id]);
  }
  for (const [projectId, ids] of byProject) {
    if (ids.length > 1) {
      report("content/lab.json", `bulles ${ids.join(", ")} ouvrent toutes "${projectId}"`);
    }
  }
}

if (findings.length === 0) {
  console.log("✓ Aucun contenu placeholder détecté — prêt pour le lancement.");
  process.exit(0);
}

console.log(`${findings.length} élément(s) de contenu à finaliser avant lancement :\n`);
const grouped = findings.reduce((acc, f) => {
  (acc[f.file] ??= []).push(f.message);
  return acc;
}, {});
for (const [file, messages] of Object.entries(grouped)) {
  console.log(`  ${file}`);
  for (const m of [...new Set(messages)]) console.log(`    - ${m}`);
}
process.exit(1);
