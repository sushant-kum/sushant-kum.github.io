import { SkipLink } from './components/SkipLink/SkipLink'
import { Nav } from './components/Nav/Nav'
import { Hero } from './sections/Hero/Hero'
import { About } from './sections/About/About'
import { Experience } from './sections/Experience/Experience'
import { Projects } from './sections/Projects/Projects'
import { Skills } from './sections/Skills/Skills'
import { Contact } from './sections/Contact/Contact'

export default function App() {
  return (
    <>
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
  )
}
