export interface InitialDepartment {
  name: string;
  code: string;
  category: string;
  supervisors: Array<{ name: string; email?: string; phone?: string }>;
}

export const INITIAL_DEPARTMENTS: InitialDepartment[] = [
  {
    name: 'Finance & Accounting',
    code: 'FIN',
    category: 'Finance',
    supervisors: [
      { name: 'Mr. Vidura' },
      { name: 'Mrs. Pavithra' },
    ],
  },
  {
    name: 'HRD & Admin',
    code: 'HRD',
    category: 'Human Resources',
    supervisors: [
      { name: 'Mr. Rohitha' },
    ],
  },
  {
    name: 'IT',
    code: 'IT',
    category: 'Technology',
    supervisors: [
      { name: 'Mr. Tharindu' },
    ],
  },
  {
    name: 'Quality Assurance',
    code: 'QA',
    category: 'Quality',
    supervisors: [
      { name: 'Mr. Wickrama' },
      { name: 'Mr. Dulan' },
    ],
  },
  {
    name: 'Production',
    code: 'PROD',
    category: 'Manufacturing',
    supervisors: [
      { name: 'Mr. Ravimal' },
      { name: 'Mr. Dhammika' },
    ],
  },
  {
    name: 'Planning',
    code: 'PLAN',
    category: 'Operations',
    supervisors: [
      { name: 'Mr. Avishka' },
      { name: 'Mr. Dhammika' },
    ],
  },
  {
    name: 'Laboratory',
    code: 'LAB',
    category: 'Quality & Testing',
    supervisors: [
      { name: 'Mr. Hasula' },
    ],
  },
  {
    name: 'Engineering',
    code: 'ENG',
    category: 'Engineering',
    supervisors: [
      { name: 'Mr. Dilanka' },
      { name: 'Mr. Shemba' },
    ],
  },
  {
    name: 'Engineering Stores',
    code: 'ENG-STR',
    category: 'Stores',
    supervisors: [
      { name: 'Mr. Thiwanka' },
      { name: 'Mr. Subash' },
    ],
  },
  {
    name: 'Finished Goods Store',
    code: 'FGS',
    category: 'Stores',
    supervisors: [
      { name: 'Mr. Dimuthu' },
      { name: 'Mr. Dhammika' },
    ],
  },
  {
    name: 'Purchasing',
    code: 'PUR',
    category: 'Procurement',
    supervisors: [
      { name: 'Mr. Manjula' },
      { name: 'Mr. Gayashan' },
    ],
  },
  {
    name: 'Raw Material Store',
    code: 'RMS',
    category: 'Stores',
    supervisors: [
      { name: 'Mr. Thiwanka' },
      { name: 'Mr. Subash' },
    ],
  },
  {
    name: 'Shift A',
    code: 'SFT-A',
    category: 'Shift Production',
    supervisors: [
      { name: 'Mr. Thushara' },
      { name: 'Mr. Ravimal' },
      { name: 'Mr. Dhammika' },
      { name: 'Mr. Rusiru' },
    ],
  },
  {
    name: 'Shift B',
    code: 'SFT-B',
    category: 'Shift Production',
    supervisors: [
      { name: 'Mr. Rathnayake' },
      { name: 'Mr. Ravimal' },
      { name: 'Mr. Dhammika' },
    ],
  },
  {
    name: 'Shift C',
    code: 'SFT-C',
    category: 'Shift Production',
    supervisors: [
      { name: 'Mr. Viraj' },
      { name: 'Mr. Ravimal' },
      { name: 'Mr. Dhammika' },
    ],
  },
  {
    name: 'Band Painting',
    code: 'B-PNT',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Band Room',
    code: 'B-RM',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Bead',
    code: 'BEAD',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Mixing',
    code: 'MIX',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Non mark',
    code: 'N-MRK',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Press Lines',
    code: 'PRESS',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Shot Blast',
    code: 'S-BLST',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Trimming',
    code: 'TRIM',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Tyre Building',
    code: 'T-BLD',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Tyre Repair',
    code: 'T-REP',
    category: 'Production Line',
    supervisors: [{ name: 'Mr. Ravimal' }, { name: 'Mr. Dhammika' }],
  },
  {
    name: 'Boiler',
    code: 'BOIL',
    category: 'Utilities',
    supervisors: [{ name: 'Mr. Dilanka' }, { name: 'Mr. Shemba' }],
  },
  {
    name: 'Electrician',
    code: 'ELEC',
    category: 'Maintenance',
    supervisors: [{ name: 'Mr. Dilanka' }, { name: 'Mr. Shemba' }],
  },
  {
    name: 'Maintenance',
    code: 'MAINT',
    category: 'Maintenance',
    supervisors: [{ name: 'Mr. Dilanka' }, { name: 'Mr. Shemba' }],
  },
  {
    name: 'Mould',
    code: 'MOULD',
    category: 'Tooling',
    supervisors: [{ name: 'Mr. Dilanka' }, { name: 'Mr. Shemba' }],
  },
  {
    name: 'EDC',
    code: 'EDC',
    category: 'Engineering & Development',
    supervisors: [{ name: 'Mr. Dilanka' }, { name: 'Mr. Shemba' }],
  },
  {
    name: 'Logistic',
    code: 'LOG',
    category: 'Supply Chain',
    supervisors: [{ name: 'Mr. Avishka' }, { name: 'Mr. Manjula' }],
  },
  {
    name: 'Supply Chain',
    code: 'SCM',
    category: 'Supply Chain',
    supervisors: [{ name: 'Mr. Manjula' }, { name: 'Mr. Gayashan' }],
  },
  {
    name: 'Research and Development',
    code: 'R&D',
    category: 'Research',
    supervisors: [{ name: 'Mr. Hasula' }],
  },
];
