export type SourceExperienceShortcut = {
  id: string
  title: string
  keywords: string
  route: string
  location: string
  status: string
  boundary: string
}

export const SOURCE_EXPERIENCE_SHORTCUTS: SourceExperienceShortcut[] = [
  {
    id: 'heart-ecg',
    title: 'Heart anatomy × ECG',
    keywords: 'heart cardiovascular ecg electrocardiogram rhythm ptb-xl',
    route: '/body-explorer',
    location: 'Body Explorer → Mechanisms → Cardiovascular',
    status: 'Interactive teaching trace available',
    boundary: 'The displayed trace is synthetic education, not recorded ECG data, a PTB-XL sample, or a rhythm diagnosis.',
  },
  {
    id: 'ct-mr',
    title: 'CT / MR volumetric teaching',
    keywords: 'ct mr mri radiology imaging dicom totalsegmentator axial coronal sagittal 3d',
    route: '/body-explorer',
    location: 'Body Explorer → Imaging → Volumetric imaging',
    status: '3D and cross-sectional teaching controls available',
    boundary: 'Reference, simulated and acquired-image states remain separate; nothing shown should be treated as patient segmentation.',
  },
  {
    id: 'pubmed',
    title: 'PubMed evidence search',
    keywords: 'pubmed evidence paper research literature clinical study',
    route: '/rujukan?t=bukti',
    location: 'Reference → Evidence',
    status: 'Live PubMed records available',
    boundary: 'Search results are literature candidates, not an AI conclusion, diagnosis, or proof that a finding applies to an individual.',
  },
  {
    id: 'money',
    title: 'Personal Finance',
    keywords: 'finance money debt cashflow emergency fund risk',
    route: '/keuangan',
    location: 'Personal Finance',
    status: 'Private on-device tools available',
    boundary: 'Educational planning only. It does not issue lending, trading, buy, or sell decisions.',
  },
]

export function matchingSourceExperiences(query: string): SourceExperienceShortcut[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return SOURCE_EXPERIENCE_SHORTCUTS
  return SOURCE_EXPERIENCE_SHORTCUTS.filter((item) =>
    `${item.title} ${item.keywords} ${item.location}`.toLocaleLowerCase().includes(needle),
  )
}
