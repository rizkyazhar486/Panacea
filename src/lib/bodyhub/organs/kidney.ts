export const KIDNEY_EDUCATIONAL_GRAPH = {
  organ: 'kidney',
  boundary: { educationalOnly: true, patientSpecific: false, note: 'Reference physiology; not patient-specific anatomy, diagnosis, prognosis, or treatment guidance.' },
  sources: [
    { id: 'ncbi-renal-flow', title: 'Physiology, Renal Blood Flow and Filtration', url: 'https://www.ncbi.nlm.nih.gov/books/NBK482248/', accessed: '2026-09-26' },
    { id: 'ncbi-bowman', title: 'Anatomy, Abdomen and Pelvis: Bowman Capsule', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554474/', accessed: '2026-09-26' },
  ],
  anatomyPath: ['renal-artery','afferent-arteriole','glomerular-capillary','efferent-arteriole','peritubular-capillary-or-vasa-recta'],
  relationships: [
    { id: 'kidney-filtration-barrier', from: 'glomerular-capillary', to: 'bowman-space', mechanism: 'Filtrate crosses fenestrated endothelium, glomerular basement membrane, and podocyte filtration slits.', sourceIds: ['ncbi-bowman'] },
    { id: 'kidney-filtration-fraction', from: 'renal-plasma-flow', to: 'glomerular-filtration', mechanism: 'Filtration fraction relates glomerular filtration rate to renal plasma flow.', formula: 'FF = GFR / RPF', sourceIds: ['ncbi-renal-flow'] },
    { id: 'kidney-autoregulation', from: 'renal-perfusion', to: 'glomerular-filtration', mechanism: 'Myogenic response and tubuloglomerular feedback buffer changes in renal blood flow and filtration.', sourceIds: ['ncbi-renal-flow'] },
  ],
} as const
