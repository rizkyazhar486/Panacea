import type { AnatomyLayer } from '../components/Body3D'

// Organ utama -> kata kunci (bukan nama node persis) yang dicocokkan lewat
// substring case-insensitive terhadap nama asli tiap struktur di lapisan 3D
// (lihat Body3D.tsx: matchesFocus). Dipakai substring, bukan daftar nama
// persis seperti workoutMuscles.ts, karena organ nyata (paru, hati, usus,
// otak) dipecah jadi puluhan-ratusan segmen bernama (lobus, gyrus, ruas usus)
// di data Z-Anatomy -- menuliskan tiap nama persis tidak praktis dan gampang
// ketinggalan satu segmen. Kata kunci di sini sudah diverifikasi cocok
// terhadap nama node nyata di kelima berkas .glb (lihat riwayat sesi).
export interface OrganFocus {
  key: string
  label: string
  layer: AnatomyLayer['key']
  keywords: string[]
  searchTerms: string[]
}

export const ORGAN_FOCUS: OrganFocus[] = [
  { key: 'heart', label: 'Heart', layer: 'cardiovascular', keywords: ['atrium', 'ventricle', 'heart', 'papillary muscle', 'chorda tendinea'], searchTerms: ['heart disease', 'cardiac arrhythmia'] },
  { key: 'lungs', label: 'Lungs', layer: 'visceral', keywords: [' lung', 'lung ', 'bronch', 'alveol', 'trachea'], searchTerms: ['lung disease', 'respiratory disease'] },
  { key: 'liver', label: 'Liver', layer: 'visceral', keywords: ['liver'], searchTerms: ['liver disease'] },
  { key: 'kidneys', label: 'Kidneys', layer: 'visceral', keywords: ['kidney', 'renal', 'nephron'], searchTerms: ['kidney disease'] },
  { key: 'stomach', label: 'Stomach', layer: 'visceral', keywords: ['stomach', 'gastric'], searchTerms: ['stomach disease', 'gastritis'] },
  { key: 'small-intestine', label: 'Small intestine', layer: 'visceral', keywords: ['duodenum', 'jejunum', 'ileum'], searchTerms: ['small intestine disease'] },
  { key: 'large-intestine', label: 'Large intestine', layer: 'visceral', keywords: ['colon', 'caecum', 'cecum', 'rectum', 'appendix', 'sigmoid'], searchTerms: ['large intestine disease', 'colon disease'] },
  { key: 'pancreas', label: 'Pancreas', layer: 'visceral', keywords: ['pancrea'], searchTerms: ['pancreatic disease'] },
  { key: 'gallbladder', label: 'Gallbladder', layer: 'visceral', keywords: ['gallbladder', 'cystic duct', 'bile duct'], searchTerms: ['gallbladder disease', 'biliary disease'] },
  { key: 'spleen', label: 'Spleen', layer: 'lymphoid', keywords: ['spleen'], searchTerms: ['spleen disease'] },
  { key: 'lymph-nodes', label: 'Lymph nodes', layer: 'lymphoid', keywords: ['node', 'lymph'], searchTerms: ['lymphadenopathy', 'lymphatic system disease'] },
  { key: 'thyroid', label: 'Thyroid', layer: 'visceral', keywords: ['thyroid'], searchTerms: ['thyroid disease'] },
  { key: 'adrenal', label: 'Adrenal glands', layer: 'visceral', keywords: ['adrenal', 'suprarenal'], searchTerms: ['adrenal gland disease'] },
  { key: 'pituitary', label: 'Pituitary gland', layer: 'visceral', keywords: ['hypophysis', 'pituitary'], searchTerms: ['pituitary gland disease'] },
  { key: 'bladder', label: 'Bladder', layer: 'visceral', keywords: ['bladder', 'urethra'], searchTerms: ['urinary bladder disease'] },
  { key: 'prostate', label: 'Prostate', layer: 'visceral', keywords: ['prostate'], searchTerms: ['prostate disease'] },
  { key: 'testis', label: 'Testis', layer: 'visceral', keywords: ['testis', 'epididymis', 'vas deferens'], searchTerms: ['testicular disease'] },
  { key: 'brain', label: 'Brain', layer: 'nervous', keywords: ['gyrus', 'sulcus', 'cerebell', 'hypothalamus', 'thalamus', 'insula', 'corpus callosum', 'amygdal', 'hippocamp'], searchTerms: ['brain disease'] },
  { key: 'spinal-cord', label: 'Spinal cord', layer: 'nervous', keywords: ['spinal cord'], searchTerms: ['spinal cord disease'] },
  { key: 'eye', label: 'Eye', layer: 'nervous', keywords: ['eyeball', 'cornea', 'iris', 'retina', 'lens of eye'], searchTerms: ['eye disease'] },
  { key: 'ear', label: 'Ear', layer: 'nervous', keywords: ['cochlea', 'tympanic', 'vestibul', 'semicircular duct'], searchTerms: ['ear disease', 'hearing loss'] },
]
