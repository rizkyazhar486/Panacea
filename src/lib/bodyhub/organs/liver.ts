export const LIVER_EDUCATIONAL_GRAPH = {
  organ: 'liver',
  boundary: { educationalOnly: true, patientSpecific: false, note: 'Reference anatomy and physiology; not patient-specific anatomy, imaging interpretation, diagnosis, prognosis, or treatment guidance.' },
  sources: [
    { id: 'ncbi-liver-anatomy', title: 'Anatomy, Abdomen and Pelvis: Liver', url: 'https://www.ncbi.nlm.nih.gov/books/NBK500014/', accessed: '2026-09-26' },
    { id: 'ncbi-liver-physiology', title: 'Physiology, Liver', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535438/', accessed: '2026-09-26' },
  ],
  bloodPath: ['portal-vein-and-hepatic-artery','portal-triad-branches','sinusoids','central-vein','hepatic-veins','ivc'],
  bilePath: ['hepatocyte-canaliculi','ductules-canals-of-hering','interlobular-bile-ducts','hepatic-ducts'],
  relationships: [
    { id: 'liver-dual-inflow', from: 'portal-vein-and-hepatic-artery', to: 'sinusoids', mechanism: 'Portal venous and hepatic arterial inflow converge through portal-triad branches into hepatic sinusoids.', sourceIds: ['ncbi-liver-anatomy','ncbi-liver-physiology'] },
    { id: 'liver-venous-outflow', from: 'sinusoids', to: 'ivc', mechanism: 'Sinusoidal blood drains toward central veins, then hepatic veins and the inferior vena cava.', sourceIds: ['ncbi-liver-anatomy','ncbi-liver-physiology'] },
    { id: 'liver-countercurrent', from: 'hepatocyte-canaliculi', to: 'portal-triad-branches', mechanism: 'Bile and sinusoidal blood move in opposite directions across the lobular organization.', sourceIds: ['ncbi-liver-physiology'] },
  ],
} as const
