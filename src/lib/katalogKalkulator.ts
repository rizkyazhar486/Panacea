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
  'Gawat Darurat', 'Saraf', 'Jantung & Paru', 'Ginjal & Cairan',
  'Anak & Neonatus', 'Obstetri', 'Bedah & Abdomen', 'THT',
  'Gizi & Antropometri', 'Lainnya',
]

/**
 * Alat yang hidup DI DALAM halaman Clinical Calculators sebagai tab.
 *
 * Dijangkau lewat /clinical-calculators?alat=<id> supaya hasil pencarian
 * mendarat langsung pada alatnya, bukan di puncak halaman.
 */
export const ALAT_DI_HALAMAN: AlatKalkulator[] = [
  { id: 'apgar', label: 'Skor APGAR', kw: 'newborn neonate birth delivery score', grup: 'Anak & Neonatus' },
  { id: 'gcs', label: 'GCS', kw: 'coma consciousness glasgow head injury neuro', grup: 'Saraf' },
  { id: 'siriraj', label: 'Skor Siriraj', kw: 'stroke haemorrhagic ischaemic bedside neuro cva perdarahan infark', grup: 'Saraf' },
  { id: 'gadjahmada', label: 'Gadjah Mada', kw: 'stroke algoritma indonesia babinski neuro cva perdarahan infark ugm', grup: 'Saraf' },
  { id: 'curb65', label: 'CURB-65', kw: 'pneumonia cap severity admission respiratory', grup: 'Jantung & Paru' },
  { id: 'bishop', label: 'Skor Bishop', kw: 'cervix induction labor obstetric delivery', grup: 'Obstetri' },
  { id: 'ckdepi', label: 'CKD-EPI', kw: 'egfr kidney renal creatinine gfr', grup: 'Ginjal & Cairan' },
  { id: 'whogrowth', label: 'Antropometri WHO', kw: 'child growth stunting weight height pediatric z-score', grup: 'Anak & Neonatus' },
  { id: 'whoneonate', label: 'Neonatus WHO', kw: 'newborn neonate growth anthropometry', grup: 'Anak & Neonatus' },
  { id: 'cdcanthro', label: 'Antropometri CDC', kw: 'child bmi percentile adolescent growth', grup: 'Anak & Neonatus' },
  { id: 'ballard', label: 'Skor Ballard + SOAP', kw: 'gestational age newborn neonate maturity lubchenco', grup: 'Anak & Neonatus' },
  { id: 'qsofa', label: 'qSOFA', kw: 'sepsis infection screening organ dysfunction', grup: 'Gawat Darurat' },
  { id: 'hollidaysegar', label: 'Cairan Rumatan', kw: 'fluid iv pediatric 4-2-1 hydration holliday-segar holliday segar maintenance fluid rumatan cairan', grup: 'Anak & Neonatus' },
  { id: 'parkland', label: 'Rumus Parkland', kw: 'burn fluid resuscitation tbsa', grup: 'Gawat Darurat' },
  { id: 'naegele', label: 'Naegele', kw: 'due date pregnancy edd lmp obstetric naegele’s rule hpht taksiran persalinan', grup: 'Obstetri' },
  { id: 'map', label: 'MAP', kw: 'blood pressure perfusion arterial shock mean arterial pressure tekanan arteri rata-rata perfusion pressure perfusi organ average', grup: 'Gawat Darurat' },
  { id: 'alvarado', label: 'Skor Alvarado', kw: 'appendicitis abdominal pain rlq surgery', grup: 'Bedah & Abdomen' },
  { id: 'centor', label: 'Centor/McIsaac', kw: 'strep pharyngitis sore throat antibiotic tonsil', grup: 'THT' },
  { id: 'nacorr', label: 'Koreksi Elektrolit', kw: 'sodium potassium hyponatremia hypokalemia glucose katz', grup: 'Ginjal & Cairan' },
  { id: 'broca', label: 'Berat Ideal Broca', kw: 'ideal body weight obesity broca’s formula berat badan', grup: 'Gizi & Antropometri' },
  { id: 'brocalorentz', label: 'Kalori Broca-Lorentz', kw: 'calorie nutrition ideal weight diet requirement kebutuhan kalori', grup: 'Gizi & Antropometri' },
  { id: 'ivdrip', label: 'Laju Tetes Infus', kw: 'infusion drops fluid rate tpm', grup: 'Ginjal & Cairan' },
  { id: 'midparental', label: 'Potensi Genetik', kw: 'height prediction child target parental tinggi potensi genetik', grup: 'Anak & Neonatus' },
  { id: 'fletcher', label: 'Indeks Fletcher', kw: 'hearing loss audiometry deaf ent', grup: 'THT' },
  { id: 'nose', label: 'Skor NOSE', kw: 'nasal obstruction breathing ent septum', grup: 'THT' },
  { id: 'rsi', label: 'RSI', kw: 'reflux lpr laryngopharyngeal hoarseness ent', grup: 'THT' },
  { id: 'aria', label: 'Kriteria ARIA', kw: 'allergic rhinitis allergy asthma ent', grup: 'THT' },
  { id: 'abcd2', label: 'ABCD²', kw: 'tia stroke risk transient ischemic', grup: 'Saraf' },
  { id: 'four', label: 'Skor FOUR', kw: 'coma consciousness icu intubated neuro', grup: 'Saraf' },
  { id: 'mcdonald', label: 'McDonald', kw: 'fundal height pregnancy gestational age obstetric mcdonald’s rule tinggi fundus uteri tfu usia kehamilan', grup: 'Obstetri' },
  { id: 'paradise', label: 'Kriteria Paradise', kw: 'tonsillectomy tonsillitis recurrent ent', grup: 'THT' },
  { id: 'nihss', label: 'NIHSS', kw: 'stroke severity neuro deficit thrombolysis', grup: 'Saraf' },
  { id: 'fluidbalance', label: 'Neraca Cairan', kw: 'intake output urine monitoring', grup: 'Ginjal & Cairan' },
  { id: 'pedsdose', label: 'Dosis Anak', kw: 'dose child weight syrup medication mg/kg', grup: 'Anak & Neonatus' },
  { id: 'vbac', label: 'VBAC Flamm-Geiger', kw: 'cesarean vaginal birth trial labor obstetric', grup: 'Obstetri' },
  { id: 'denver', label: 'Denver II (Disederhanakan)', kw: 'development milestone child screening delay', grup: 'Anak & Neonatus' },
  { id: 'atls', label: 'Survei Trauma XABCDE', kw: 'trauma primary survey hemorrhage emergency', grup: 'Gawat Darurat' },
  { id: 'acls', label: 'Panduan ACLS', kw: 'cardiac arrest cpr resuscitation algorithm emergency', grup: 'Gawat Darurat' },
  { id: 'abg', label: 'Analisis Gas Darah', kw: 'abg acidosis alkalosis anion gap ph co2', grup: 'Jantung & Paru' },
  { id: 'burn', label: 'Kalkulator Luka Bakar', kw: 'burn tbsa parkland rule of nines advanced burn calculator luka bakar tbsa', grup: 'Gawat Darurat' },
  { id: 'cranial', label: 'Saraf Kranial + Meningeal', kw: 'neuro exam nerves meningitis kernig brudzinski', grup: 'Saraf' },
  { id: 'competencies', label: 'Pemantau Kompetensi', kw: 'kki aipki education doctor competency', grup: 'Lainnya' },
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
