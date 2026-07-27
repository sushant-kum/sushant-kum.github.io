import { CursorGlow } from './components/CursorGlow/CursorGlow';
import { Nav } from './components/Nav/Nav';
import { Preloader } from './components/Preloader/Preloader';
import { ScrollProgress } from './components/ScrollProgress/ScrollProgress';
import { SkipLink } from './components/SkipLink/SkipLink';
import { Spotlight } from './components/Spotlight/Spotlight';
import { About } from './sections/About/About';
import { Contact } from './sections/Contact/Contact';
import { Experience } from './sections/Experience/Experience';
import { Hero } from './sections/Hero/Hero';
import { Projects } from './sections/Projects/Projects';
import { Skills } from './sections/Skills/Skills';

const App = () => (
  <>
    <Preloader />
    <CursorGlow />
    <Spotlight />
    <ScrollProgress />
    <SkipLink />
    <Nav />
    <main id="main">
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Skills />
    </main>
    <Contact />
  </>
);

export default App;
