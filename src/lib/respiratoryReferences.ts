export interface RespiratoryTeachingReference {
  label: string
  href: string
  supports: string
}

export const RESPIRATORY_TEACHING_REFERENCES: readonly RespiratoryTeachingReference[] = [
  {
    label: 'NCBI Bookshelf · Physiology, Tidal Volume',
    href: 'https://www.ncbi.nlm.nih.gov/books/NBK482502/',
    supports: 'Minute ventilation and alveolar ventilation relationships using respiratory rate, tidal volume and dead space.',
  },
  {
    label: 'NCBI Bookshelf · Anatomy, Anatomic Dead Space',
    href: 'https://www.ncbi.nlm.nih.gov/books/NBK442016/',
    supports: 'Anatomic/physiologic dead-space concepts and the relationship between total, alveolar and dead-space ventilation.',
  },
  {
    label: 'NCBI Bookshelf · Physiology, Lung Dead Space',
    href: 'https://www.ncbi.nlm.nih.gov/books/NBK482501/',
    supports: 'Dead-space physiology, Bohr framework and the distinction between ventilation reaching alveoli versus non-exchanging volume.',
  },
] as const
