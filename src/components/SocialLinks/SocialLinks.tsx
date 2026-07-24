// GitHub/LinkedIn use inline brand marks (lucide-react has no brand icons);
// Website/Email use Lucide. Icons are decorative (aria-hidden); the accessible
// name comes from aria-label + the visible text label.
import { Globe, Mail } from 'lucide-react';

import { GithubIcon, LinkedinIcon } from './BrandIcons';
import styles from './SocialLinks.module.scss';
import { profile } from '../../data/profile';

const LINKS = [
  { label: 'GitHub', href: profile.contact.github, Icon: GithubIcon },
  { label: 'LinkedIn', href: profile.contact.linkedin, Icon: LinkedinIcon },
  { label: 'Website', href: profile.contact.site, Icon: Globe },
  { label: 'Email', href: `mailto:${profile.contact.email}`, Icon: Mail },
];

export const SocialLinks = () => (
  <ul className={styles.list}>
    {LINKS.map(({ label, href, Icon }) => {
      const external = href.startsWith('http');
      return (
        <li key={label}>
          <a
            className={styles.link}
            href={href}
            aria-label={label}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Icon className={styles.icon} aria-hidden="true" focusable="false" size={20} />
            <span>{label}</span>
          </a>
        </li>
      );
    })}
  </ul>
);
