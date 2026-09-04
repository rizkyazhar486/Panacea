// Peta ringan region-tubuh → kata kunci pencarian ontologi. Ini BUKAN model
// anatomi 3D (lihat catatan di BodyExplorer.tsx untuk kenapa) — cukup untuk
// menautkan satu titik yang diklik pada siluet ke istilah nyata di Human
// Disease Ontology / Human Phenotype Ontology lewat /api/anatomy/ontology.
// Kata kuncinya sengaja umum (nama sistem organ) supaya OLS4 mengembalikan
// istilah tingkat-atas yang relevan, bukan penyakit yang terlalu spesifik.
export interface BodyRegion {
  key: string
  label: string
  x: number // persen posisi pada siluet (viewBox 0..200 lebar, 0..440 tinggi)
  y: number
  searchTerms: string[]
}

export const BODY_REGIONS: BodyRegion[] = [
  { key: 'head', label: 'Head & Brain', x: 50, y: 9, searchTerms: ['headache', 'brain disease'] },
  { key: 'neck', label: 'Neck & Thyroid', x: 50, y: 17, searchTerms: ['thyroid disease'] },
  { key: 'chest', label: 'Chest & Lungs', x: 50, y: 26, searchTerms: ['respiratory disease', 'chest pain'] },
  { key: 'heart', label: 'Heart', x: 42, y: 27, searchTerms: ['heart disease', 'cardiac arrhythmia'] },
  { key: 'abdomen', label: 'Abdomen & Digestion', x: 50, y: 38, searchTerms: ['gastrointestinal disease', 'abdominal pain'] },
  { key: 'liver', label: 'Liver', x: 40, y: 36, searchTerms: ['liver disease'] },
  { key: 'kidney', label: 'Kidneys', x: 60, y: 40, searchTerms: ['kidney disease'] },
  { key: 'pelvis', label: 'Pelvis & Reproductive', x: 50, y: 47, searchTerms: ['pelvic pain', 'reproductive system disease'] },
  { key: 'arm-left', label: 'Left Arm', x: 22, y: 33, searchTerms: ['arm pain', 'peripheral neuropathy'] },
  { key: 'arm-right', label: 'Right Arm', x: 78, y: 33, searchTerms: ['arm pain', 'peripheral neuropathy'] },
  { key: 'leg-left', label: 'Left Leg', x: 42, y: 78, searchTerms: ['leg pain', 'peripheral vascular disease'] },
  { key: 'leg-right', label: 'Right Leg', x: 58, y: 78, searchTerms: ['leg pain', 'peripheral vascular disease'] },
  { key: 'skin', label: 'Skin', x: 50, y: 62, searchTerms: ['skin disease'] },
]
