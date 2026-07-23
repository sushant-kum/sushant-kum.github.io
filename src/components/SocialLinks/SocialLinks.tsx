// NOTE: lucide-react removed brand/logo icons (Github, Linkedin) in current
// major version — using closest available generic icons instead. Icons are
// decorative (aria-hidden); the accessible name comes from aria-label.
import { Code2, Briefcase, Globe, Mail } from 'lucide-react'
import { profile } from '../../data/profile'
import styles from './SocialLinks.module.scss'

const LINKS = [
  { label: 'GitHub', href: profile.contact.github, Icon: Code2 },
  { label: 'LinkedIn', href: profile.contact.linkedin, Icon: Briefcase },
  { label: 'Website', href: profile.contact.site, Icon: Globe },
  { label: 'Email', href: `mailto:${profile.contact.email}`, Icon: Mail },
]

export function SocialLinks() {
  return (
    <ul className={styles.list}>
      {LINKS.map(({ label, href, Icon }) => {
        const external = href.startsWith('http')
        return (
          <li key={label}>
            <a className={styles.link} href={href} aria-label={label}
               {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <Icon className={styles.icon} aria-hidden="true" focusable="false" size={20} />
              <span>{label}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
