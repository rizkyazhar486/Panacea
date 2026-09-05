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
  { key: 'external-nose', label: 'Nose (external)', layer: 'surface', keywords: ['nose', 'nasal region', 'nostril', 'ala of nose'], searchTerms: ['nose disease', 'nasal disease'] },
  { key: 'external-ear', label: 'Ear (external)', layer: 'surface', keywords: ['auricle', 'auricular region', 'antihelix', 'antitragus', 'tragus'], searchTerms: ['external ear disease'] },
  { key: 'larynx', label: 'Larynx', layer: 'visceral', keywords: ['larynx', 'vocal', 'thyroid cartilage', 'cricoid', 'arytenoid'], searchTerms: ['laryngeal disease'] },

  // ── THT: struktur yang TERNYATA SUDAH ADA di data ───────────────────────
  // Sesi sebelumnya menyatakan tidak ada geometri THT khusus di dataset ini.
  // Itu KELIRU, dan diperiksa ulang dengan membaca nama node di berkas .glb:
  // ketiga tulang pendengaran, gendang telinga, saraf koklea & vestibular,
  // septum & konka hidung, serta ketiga bagian faring semuanya ada sebagai
  // node bernama tersendiri. Yang memang TIDAK ada hanyalah bola matanya —
  // hanya saraf optik dan kiasma yang tersedia. Entri di bawah membuka
  // struktur yang benar-benar ada, alih-alih membiarkannya tidak terjangkau
  // karena satu pernyataan yang tidak diperiksa.
  { key: 'ossicles', label: 'Ear ossicles', layer: 'skeletal', keywords: ['malleus', 'incus', 'stapes'], searchTerms: ['ossicle disease', 'conductive hearing loss'] },
  { key: 'eardrum', label: 'Eardrum & middle ear', layer: 'nervous', keywords: ['tympanic membrane', 'chorda tympani'], searchTerms: ['tympanic membrane disease', 'otitis media'] },
  { key: 'inner-ear-nerve', label: 'Hearing & balance nerves', layer: 'nervous', keywords: ['cochlear nerve', 'vestibular nerve', 'vestibulocochlear', 'cochlear nucleus', 'vestibular nuclei'], searchTerms: ['vestibulocochlear nerve disease', 'sensorineural hearing loss'] },
  { key: 'nasal-septum', label: 'Nasal septum & conchae', layer: 'skeletal', keywords: ['nasal septal cartilage', 'nasal concha', 'nasal bone'], searchTerms: ['nasal septum deviation', 'nasal obstruction'] },
  { key: 'pharynx', label: 'Pharynx (naso/oro/laryngo)', layer: 'visceral', keywords: ['nasopharynx', 'oropharynx', 'laryngopharynx', 'epiglottis'], searchTerms: ['pharyngeal disease', 'pharyngitis'] },
  { key: 'optic-pathway', label: 'Optic pathway', layer: 'nervous', keywords: ['optic nerve', 'optic chiasm', 'optic tract'], searchTerms: ['optic nerve disease', 'visual pathway disorder'] },

  // Rangka dan kulit sebagai SASARAN yang bisa diketuk. Keduanya punya lapisan
  // 3D-nya sendiri sejak awal, tapi tidak pernah punya entri organ — sehingga
  // kelainan bawaan tulang dan kulit tidak punya tempat untuk ditampilkan.
  { key: 'skeleton', label: 'Skeleton', layer: 'skeletal', keywords: ['bone', 'vertebra', 'femur', 'humerus', 'tibia', 'rib', 'skull', 'pelvis', 'ilium', 'sternum'], searchTerms: ['bone disease', 'skeletal dysplasia'] },
  { key: 'skin', label: 'Skin', layer: 'surface', keywords: ['skin', 'region'], searchTerms: ['skin disease', 'genodermatosis'] },
  { key: 'peripheral-nerves', label: 'Peripheral nerves', layer: 'nervous', keywords: ['nerve', 'plexus', 'ganglion'], searchTerms: ['peripheral nervous system disease', 'neuropathy'] },
]
