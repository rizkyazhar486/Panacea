// Katalog kalkulator klinis — SATU sumber untuk halaman alatnya, hub, dan
// pencarian.
//
// Sebelumnya ada dua daftar yang ditulis terpisah: TABS di dalam halaman
// Clinical Calculators, dan daftar tangan di Calculator Hub. Keduanya tidak
// pernah dijaga tetap sama, dan akibatnya terukur: 34 dari 47 alat -- Bishop,
// CKD-EPI, qSOFA, Parkland, Alvarado, dan seterusnya -- tidak muncul sama
// sekali di katalog. Alat yang tidak bisa dicari sama saja dengan alat yang
// tidak ada, karena tidak ada yang menggulir halaman 2.681 baris demi
// menemukannya.
//
// Daftar ini yang dipakai keduanya. Menambah alat cukup di satu tempat.

export interface AlatKalkulator {
  /** Sama dengan id tab di halaman Clinical Calculators. */
  id: string
  label: string
  /** Kata kunci pencarian: organ, gejala, situasi, dan sinonim Indonesianya. */
  kw: string
  /** Sistem organ atau situasi klinis. Dipakai untuk mengelompokkan di layar. */
  grup: string
}

/**
 * Urutan kelompok di layar: yang paling menentukan keputusan cepat lebih dulu.
 *
 * Gawat darurat di atas karena di sanalah waktu paling menentukan; "Lainnya"
 * di paling bawah karena isinya memang tidak berkelompok.
 */
export const URUTAN_GRUP = [
  'Emergency', 'Neurology', 'Heart & Lungs', 'Kidney & Fluids',
  'Paediatrics & Neonates', 'Obstetrics', 'Surgery & Abdomen', 'ENT',
  'Nutrition & Anthropometry', 'Other',
]

/**
 * Alat yang hidup DI DALAM halaman Clinical Calculators sebagai tab.
 *
 * Dijangkau lewat /clinical-calculators?alat=<id> supaya hasil pencarian
 * mendarat langsung pada alatnya, bukan di puncak halaman.
 */
export const ALAT_DI_HALAMAN: AlatKalkulator[] = [
  { id: 'apgar', label: 'APGAR', kw: 'newborn neonate birth delivery score', grup: 'Paediatrics & Neonates' },
  { id: 'gcs', label: 'GCS', kw: 'coma consciousness glasgow head injury neuro', grup: 'Neurology' },
  { id: 'siriraj', label: 'Siriraj', kw: 'stroke haemorrhagic ischaemic bedside neuro cva perdarahan infark', grup: 'Neurology' },
  { id: 'gadjahmada', label: 'Gadjah Mada', kw: 'stroke algoritma indonesia babinski neuro cva perdarahan infark ugm', grup: 'Neurology' },
  { id: 'curb65', label: 'CURB-65', kw: 'pneumonia cap severity admission respiratory', grup: 'Heart & Lungs' },
  { id: 'bishop', label: 'Bishop', kw: 'cervix induction labor obstetric delivery', grup: 'Obstetrics' },
  { id: 'ckdepi', label: 'CKD-EPI', kw: 'egfr kidney renal creatinine gfr', grup: 'Kidney & Fluids' },
  { id: 'whogrowth', label: 'WHO Anthropometry', kw: 'child growth stunting weight height pediatric z-score', grup: 'Paediatrics & Neonates' },
  { id: 'whoneonate', label: 'WHO Neonate', kw: 'newborn neonate growth anthropometry', grup: 'Paediatrics & Neonates' },
  { id: 'cdcanthro', label: 'CDC Anthropometry', kw: 'child bmi percentile adolescent growth', grup: 'Paediatrics & Neonates' },
  { id: 'ballard', label: 'Ballard+SOAP', kw: 'gestational age newborn neonate maturity lubchenco', grup: 'Paediatrics & Neonates' },
  { id: 'qsofa', label: 'qSOFA', kw: 'sepsis infection screening organ dysfunction', grup: 'Emergency' },
  { id: 'hollidaysegar', label: 'Maintenance Fluid', kw: 'fluid iv pediatric 4-2-1 hydration holliday-segar holliday segar maintenance fluid rumatan cairan', grup: 'Paediatrics & Neonates' },
  { id: 'parkland', label: 'Parkland', kw: 'burn fluid resuscitation tbsa', grup: 'Emergency' },
  { id: 'naegele', label: 'Naegele', kw: 'due date pregnancy edd lmp obstetric naegele’s rule hpht taksiran persalinan', grup: 'Obstetrics' },
  { id: 'map', label: 'MAP', kw: 'blood pressure perfusion arterial shock mean arterial pressure tekanan arteri rata-rata perfusion pressure perfusi organ average', grup: 'Emergency' },
  { id: 'alvarado', label: 'Alvarado', kw: 'appendicitis abdominal pain rlq surgery', grup: 'Surgery & Abdomen' },
  { id: 'centor', label: 'Centor/McIsaac', kw: 'strep pharyngitis sore throat antibiotic tonsil', grup: 'ENT' },
  { id: 'nacorr', label: 'Electrolyte Correction', kw: 'sodium potassium hyponatremia hypokalemia glucose katz', grup: 'Kidney & Fluids' },
  { id: 'broca', label: 'Broca IBW', kw: 'ideal body weight obesity broca’s formula berat badan', grup: 'Nutrition & Anthropometry' },
  { id: 'brocalorentz', label: 'Broca-Lorentz Calorie', kw: 'calorie nutrition ideal weight diet requirement kebutuhan kalori', grup: 'Nutrition & Anthropometry' },
  { id: 'ivdrip', label: 'IV Drip Rate', kw: 'infusion drops fluid rate tpm', grup: 'Kidney & Fluids' },
  { id: 'midparental', label: 'Mid-Parental', kw: 'height prediction child target parental tinggi potensi genetik', grup: 'Paediatrics & Neonates' },
  { id: 'fletcher', label: 'Fletcher Index', kw: 'hearing loss audiometry deaf ent', grup: 'ENT' },
  { id: 'nose', label: 'NOSE', kw: 'nasal obstruction breathing ent septum', grup: 'ENT' },
  { id: 'rsi', label: 'RSI', kw: 'reflux lpr laryngopharyngeal hoarseness ent', grup: 'ENT' },
  { id: 'aria', label: 'ARIA Criteria', kw: 'allergic rhinitis allergy asthma ent', grup: 'ENT' },
  { id: 'abcd2', label: 'ABCD²', kw: 'tia stroke risk transient ischemic', grup: 'Neurology' },
  { id: 'four', label: 'FOUR Score', kw: 'coma consciousness icu intubated neuro', grup: 'Neurology' },
  { id: 'mcdonald', label: 'McDonald', kw: 'fundal height pregnancy gestational age obstetric mcdonald’s rule tinggi fundus uteri tfu usia kehamilan', grup: 'Obstetrics' },
  { id: 'paradise', label: 'Paradise', kw: 'tonsillectomy tonsillitis recurrent ent', grup: 'ENT' },
  { id: 'nihss', label: 'NIHSS', kw: 'stroke severity neuro deficit thrombolysis', grup: 'Neurology' },
  { id: 'fluidbalance', label: 'Fluid Balance', kw: 'intake output urine monitoring', grup: 'Kidney & Fluids' },
  { id: 'pedsdose', label: 'Pediatric Dosing', kw: 'dose child weight syrup medication mg/kg', grup: 'Paediatrics & Neonates' },
  { id: 'vbac', label: 'VBAC Flamm-Geiger', kw: 'cesarean vaginal birth trial labor obstetric', grup: 'Obstetrics' },
  { id: 'denver', label: 'Denver II (Simplified)', kw: 'development milestone child screening delay', grup: 'Paediatrics & Neonates' },
  { id: 'atls', label: 'XABCDE Trauma Survey', kw: 'trauma primary survey hemorrhage emergency', grup: 'Emergency' },
  { id: 'acls', label: 'ACLS Guide', kw: 'cardiac arrest cpr resuscitation algorithm emergency', grup: 'Emergency' },
  { id: 'abg', label: 'Blood Gas Analysis', kw: 'abg acidosis alkalosis anion gap ph co2', grup: 'Heart & Lungs' },
  { id: 'burn', label: 'Burn Calculator', kw: 'burn tbsa parkland rule of nines advanced burn calculator luka bakar tbsa', grup: 'Emergency' },
  { id: 'cranial', label: 'Cranial Nerve + Meningeal', kw: 'neuro exam nerves meningitis kernig brudzinski', grup: 'Neurology' },
  { id: 'competencies', label: 'Competency Tracker', kw: 'kki aipki education doctor competency', grup: 'Other' },
]

/**
 * Samakan bentuk teks sebelum dicocokkan.
 *
 * Kata kunci di berkas ini memakai apostrof tipografis (’) karena apostrof
 * lurus (\') akan menutup literal berkutip tunggal dan memecah berkasnya.
 * Papan ketik mengetik yang lurus. Tanpa penyamaan ini, mengetik "naegele\'s"
 * tidak akan menemukan apa pun — kata kuncinya ada, tetapi bentuknya berbeda
 * satu karakter, dan yang gagal hanya terlihat oleh orang yang mencarinya.
 */
export function samakan(t: string): string {
  return t.toLowerCase().replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u2013\u2014]/g, '-')
}

/** Benar bila alat ini cocok dengan yang diketik. */
export function cocokAlat(a: AlatKalkulator, q: string): boolean {
  return samakan(a.label + ' ' + a.kw).includes(samakan(q))
}

/** Alamat yang membuka satu alat langsung pada tabnya. */
export function tautanAlat(id: string): string {
  return `/clinical-calculators?alat=${encodeURIComponent(id)}`
}
