import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { Laboratory } from "./components/Laboratory";
import { Stack } from "./components/Stack";
import { Recommendations } from "./components/Recommendations";
import { Footer } from "./components/Footer";
import { ProjectModal } from "./components/ProjectModal";
import { Project } from "./data";
import { palette } from "./theme";

export default function App() {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: `radial-gradient(1200px 600px at 50% -10%, ${palette.bgAlt}, ${palette.bg})`,
        color: palette.text,
      }}
    >
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects onOpen={setActive} />
        <Laboratory onOpen={setActive} />
        <Stack />
        <Recommendations />
      </main>
      <Footer />
      <ProjectModal project={active} onClose={() => setActive(null)} />
    </div>
  );
}
