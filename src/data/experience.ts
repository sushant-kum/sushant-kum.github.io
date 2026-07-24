type Role = { title: string; period: string; duration: string };
export type Company = { company: string; roles: Role[] };

export const experience: Company[] = [
  {
    company: 'Workfabric AI',
    roles: [{ title: 'Senior Software Engineer', period: 'Dec 2025 — Present', duration: '' }],
  },
  {
    company: 'Soroco',
    roles: [
      {
        title: 'Senior Software Engineer, Product',
        period: 'Oct 2021 — Dec 2025',
        duration: '4 yrs 3 mos',
      },
      {
        title: 'Software Engineer, Full-Stack',
        period: 'May 2019 — Oct 2021',
        duration: '2 yrs 6 mos',
      },
    ],
  },
  {
    company: 'Plankton Solutions',
    roles: [
      { title: 'Software Engineer', period: 'Oct 2017 — May 2019', duration: '1 yr 8 mos' },
      { title: 'Engineering Intern', period: 'Feb 2017 — Sep 2017', duration: '8 mos' },
    ],
  },
  {
    company: 'Bharat Heavy Electricals Ltd (BHEL)',
    roles: [{ title: 'Engineering Intern', period: '2015', duration: 'ASP.NET · Oracle' }],
  },
];
