import { semuaObat } from './obatKatalog'
import { semuaHerbal } from './herbal'

// ─────────────────────────────────────────────────────────────────────────────
// Pemeriksa interaksi — obat dengan obat, dan obat dengan herbal.
//
// APA YANG ALAT INI ADALAH, DAN APA YANG BUKAN. Ini harus dinyatakan lebih
// dahulu, sebab kesalahpahaman di sini berbahaya.
//
// INI BUKAN pemeriksa interaksi yang lengkap. Ia memeriksa MEKANISME yang
// ditulis ke dalam aplikasi ini, dan tidak lebih. Tidak ditemukannya sesuatu
// TIDAK berarti kombinasi itu aman — ia berarti tidak ada aturan di sini yang
// cocok. Kalimat itu tampil di layar setiap kali hasilnya kosong, sebab hasil
// kosong yang dibaca sebagai "aman" justru kegagalan yang paling merugikan
// yang bisa dilakukan alat semacam ini.
//
// MENGAPA MEKANISME, BUKAN DAFTAR PASANGAN. Menuliskan tiap pasangan obat
// satu per satu berarti 550 x 550 kemungkinan, dan yang tertulis akan selalu
// sebagian kecil saja — sementara layar tetap tampak seperti memeriksa
// semuanya. Dengan menandai MEKANISME (menginduksi CYP3A4, menambah risiko
// perdarahan, menurunkan kalium, memanjangkan QT), satu aturan menjangkau
// seluruh golongan sekaligus, dan alasannya dapat ditampilkan apa adanya —
// pembaca melihat MENGAPA, bukan sekadar "hati-hati".
//
// OBAT DITANDAI MENURUT GOLONGANNYA, bukan satu per satu. Golongan sudah ada
// di katalog dan sudah benar; menandai ulang tiap zat hanya menambah tempat
// baru untuk keliru. Beberapa zat memang punya penandaan sendiri karena
// perilakunya menyimpang dari golongannya, dan itu ditulis terpisah.
//
// TIDAK MENYALAKAN PERINGATAN PADA TERAPI YANG MEMANG DISENGAJA. Dua
// antihipertensi bersama adalah pengobatan yang benar, bukan interaksi.
// Aturan yang akan menyala pada kombinasi lazim ditandai `hanyaHerbal`,
// sehingga ia hanya berlaku ketika salah satu pihaknya herbal. Peringatan yang
// menyala terus-menerus berhenti dibaca, dan sesudah itu peringatan yang
// benar-benar penting ikut tidak terbaca.
// ─────────────────────────────────────────────────────────────────────────────

export type Tanda =
  | 'induksi-cyp3a4' | 'hambat-cyp3a4'
  | 'antikoagulan' | 'antiplatelet' | 'risiko-perdarahan'
  | 'hipoglikemik'
  | 'sedatif'
  | 'serotonergik'
  | 'qt'
  | 'kalium-turun' | 'kalium-naik'
  | 'digoksin'
  | 'imunosupresan'
  | 'antihipertensi'
  | 'levodopa'
  | 'hepatotoksik'
  | 'nefrotoksik'
  | 'kontrasepsi-hormonal'
  | 'antiretroviral'
  | 'nitrat' | 'pde5'
  | 'litium'

/** Penandaan menurut GOLONGAN farmakologi di katalog obat. */
const TANDA_KELAS: { cocok: RegExp; tanda: Tanda[] }[] = [
  { cocok: /anticoagulant|heparin|vitamin K antagonist|factor Xa|thrombin inhibitor/i, tanda: ['antikoagulan', 'risiko-perdarahan'] },
  { cocok: /antiplatelet|P2Y12/i, tanda: ['antiplatelet', 'risiko-perdarahan'] },
  { cocok: /thrombolytic/i, tanda: ['risiko-perdarahan'] },
  { cocok: /NSAID|COX-2/i, tanda: ['risiko-perdarahan', 'nefrotoksik'] },
  { cocok: /biguanide|sulfonylurea|SGLT2|DPP-4|GLP-1|insulin|glucosidase|thiazolidinedione/i, tanda: ['hipoglikemik'] },
  { cocok: /benzodiazepine|hypnotic|anaesthetic|opioid|barbiturate|antihistamine|antipsychotic/i, tanda: ['sedatif'] },
  { cocok: /SSRI|SNRI|tricyclic antidepressant|serotonin|triptan|5-HT1B/i, tanda: ['serotonergik'] },
  { cocok: /macrolide|fluoroquinolone|antiarrhythmic|antipsychotic|5-HT3 antagonist|triazole antifungal/i, tanda: ['qt'] },
  { cocok: /loop diuretic|thiazide/i, tanda: ['kalium-turun', 'antihipertensi'] },
  { cocok: /mineralocorticoid receptor antagonist|potassium-sparing|non-steroidal MRA/i, tanda: ['kalium-naik', 'antihipertensi'] },
  { cocok: /ACE inhibitor|angiotensin receptor blocker|neprilysin/i, tanda: ['kalium-naik', 'antihipertensi'] },
  { cocok: /cardiac glycoside/i, tanda: ['digoksin'] },
  { cocok: /calcineurin inhibitor|mTOR inhibitor|immunosuppressant|anti-TNF|JAK inhibitor|IL-6|IL-12/i, tanda: ['imunosupresan'] },
  { cocok: /beta blocker|calcium channel blocker|alpha-2 agonist|vasodilator|alpha-1 blocker|If channel/i, tanda: ['antihipertensi'] },
  { cocok: /dopamine precursor|dopamine agonist|MAO-B|COMT/i, tanda: ['levodopa'] },
  { cocok: /statin|HMG-CoA|antituberculosis|triazole antifungal|antiretroviral|reverse transcriptase|protease inhibitor/i, tanda: ['hepatotoksik'] },
  { cocok: /aminoglycoside|glycopeptide|polymyxin|platinum compound|contrast medium/i, tanda: ['nefrotoksik'] },
  { cocok: /contraceptive|progestogen|oestrogen/i, tanda: ['kontrasepsi-hormonal'] },
  { cocok: /reverse transcriptase inhibitor|integrase|protease inhibitor|non-nucleoside/i, tanda: ['antiretroviral'] },
  { cocok: /nitrate/i, tanda: ['nitrat'] },
  { cocok: /PDE5/i, tanda: ['pde5'] },
  { cocok: /mood stabiliser/i, tanda: ['litium'] },
]

/** Zat yang perilakunya menyimpang dari golongannya. Ditulis satu per satu. */
const TANDA_ZAT: Record<string, Tanda[]> = {
  'Rifampicin': ['induksi-cyp3a4', 'hepatotoksik'],
  'Carbamazepine': ['induksi-cyp3a4'],
  'Phenytoin': ['induksi-cyp3a4'],
  'Phenobarbital': ['induksi-cyp3a4'],
  'Clarithromycin': ['hambat-cyp3a4', 'qt'],
  'Erythromycin': ['hambat-cyp3a4', 'qt'],
  'Itraconazole': ['hambat-cyp3a4'],
  'Voriconazole': ['hambat-cyp3a4', 'hepatotoksik'],
  'Ketoconazole (topical)': ['hambat-cyp3a4'],
  'Ritonavir': ['hambat-cyp3a4', 'antiretroviral'],
  'Nirmatrelvir/ritonavir': ['hambat-cyp3a4'],
  'Cimetidine': ['hambat-cyp3a4'],
  'Lithium carbonate': ['litium'],
  'Amiodarone': ['qt', 'hepatotoksik', 'hambat-cyp3a4'],
  'Tramadol': ['serotonergik', 'sedatif'],
  'Linezolid': ['serotonergik'],
  'Methotrexate': ['hepatotoksik', 'nefrotoksik'],
  'Paracetamol': ['hepatotoksik'],
  'Isoniazid': ['hepatotoksik'],
  'Pyrazinamide': ['hepatotoksik'],
  'Warfarin': ['antikoagulan', 'risiko-perdarahan'],
  'Aspirin (low dose)': ['antiplatelet', 'risiko-perdarahan'],
  'Aspirin (analgesic dose)': ['antiplatelet', 'risiko-perdarahan'],
  'Digoxin': ['digoksin'],
  'Glyceryl trinitrate': ['nitrat'],
  'Isosorbide dinitrate': ['nitrat'],
  'Sildenafil': ['pde5'],
  'Tadalafil': ['pde5'],
  'Levodopa/carbidopa': ['levodopa'],
  'Spironolactone': ['kalium-naik', 'antihipertensi'],
  'Liquorice': ['kalium-turun'],
}

/** Penandaan herbal, ditulis per tanaman. */
const TANDA_HERBAL: Record<string, Tanda[]> = {
  "Hypericum perforatum": ['induksi-cyp3a4', 'serotonergik'],
  'Commiphora mukul': ['induksi-cyp3a4'],
  'Schisandra chinensis': ['hambat-cyp3a4'],
  'Coptis chinensis / Berberis spp.': ['hambat-cyp3a4', 'hipoglikemik'],
  'Ginkgo biloba': ['risiko-perdarahan'],
  'Allium sativum': ['risiko-perdarahan', 'antihipertensi'],
  'Zingiber officinale': ['risiko-perdarahan'],
  'Curcuma longa': ['risiko-perdarahan'],
  'Salvia miltiorrhiza': ['risiko-perdarahan', 'antikoagulan'],
  'Angelica sinensis': ['risiko-perdarahan'],
  'Matricaria chamomilla': ['risiko-perdarahan', 'sedatif'],
  'Ganoderma lucidum': ['risiko-perdarahan', 'antihipertensi'],
  'Emblica officinalis': ['risiko-perdarahan'],
  'Trigonella foenum-graecum': ['hipoglikemik', 'risiko-perdarahan'],
  'Momordica charantia': ['hipoglikemik'],
  'Cinnamomum spp.': ['hipoglikemik', 'hepatotoksik'],
  'Cinnamomum burmannii': ['hipoglikemik', 'hepatotoksik'],
  'Syzygium polyanthum': ['hipoglikemik'],
  'Ocimum tenuiflorum': ['hipoglikemik', 'risiko-perdarahan'],
  'Panax ginseng': ['hipoglikemik'],
  'Valeriana officinalis': ['sedatif'],
  'Piper methysticum': ['sedatif', 'hepatotoksik'],
  'Withania somnifera': ['sedatif', 'hepatotoksik', 'imunosupresan'],
  'Bacopa monnieri': ['sedatif'],
  'Cannabis sativa': ['sedatif'],
  'Glycyrrhiza glabra': ['kalium-turun', 'antihipertensi'],
  'Glycyrrhiza uralensis': ['kalium-turun'],
  'Aloe vera': ['kalium-turun'],
  'Morinda citrifolia': ['kalium-naik', 'hepatotoksik'],
  'Astragalus membranaceus': ['imunosupresan'],
  'Mucuna pruriens': ['levodopa'],
  'Camellia sinensis': ['hepatotoksik'],
  'Garcinia cambogia': ['hepatotoksik'],
  'Tinospora crispa': ['hepatotoksik'],
  'Ephedra sinica': ['antihipertensi'],
  'Crataegus spp.': ['antihipertensi', 'digoksin'],
  'Terminalia arjuna': ['antihipertensi', 'risiko-perdarahan'],
  'Nigella sativa': ['antihipertensi', 'hipoglikemik'],
  'Orthosiphon aristatus': ['kalium-turun'],
  'Eurycoma longifolia': ['pde5'],
  'Silybum marianum': ['hambat-cyp3a4'],
}

export type Berat = 'serius' | 'perhatian'

interface Aturan {
  a: Tanda
  b: Tanda
  berat: Berat
  judul: string
  sebab: string
  /** Hanya berlaku bila salah satu pihaknya herbal — lihat kepala berkas. */
  hanyaHerbal?: boolean
}

const ATURAN: Aturan[] = [
  { a: 'induksi-cyp3a4', b: 'kontrasepsi-hormonal', berat: 'serius',
    judul: 'Hormonal contraception may fail',
    sebab: 'Enzyme induction lowers hormone levels enough to cause unplanned pregnancy. Additional non-hormonal contraception is needed during use and for a period afterwards.' },
  { a: 'induksi-cyp3a4', b: 'antiretroviral', berat: 'serius',
    judul: 'Antiretroviral levels fall — risk of losing viral control and of resistance',
    sebab: 'Induction reduces drug exposure. This combination has caused treatment failure.' },
  { a: 'induksi-cyp3a4', b: 'imunosupresan', berat: 'serius',
    judul: 'Transplant rejection risk',
    sebab: 'Induction lowers tacrolimus and ciclosporin levels. Rejection has been reported with this combination.' },
  { a: 'induksi-cyp3a4', b: 'antikoagulan', berat: 'serius',
    judul: 'Anticoagulation may become ineffective',
    sebab: 'Induction reduces anticoagulant exposure, and the loss of effect is not visible without monitoring.' },
  { a: 'hambat-cyp3a4', b: 'imunosupresan', berat: 'serius',
    judul: 'Immunosuppressant levels may rise to toxic range',
    sebab: 'Enzyme inhibition raises exposure of narrow-index drugs; nephrotoxicity and neurotoxicity follow.' },
  { a: 'hambat-cyp3a4', b: 'antikoagulan', berat: 'perhatian',
    judul: 'Anticoagulant effect may increase',
    sebab: 'Inhibition raises exposure, increasing bleeding risk.' },
  { a: 'risiko-perdarahan', b: 'antikoagulan', berat: 'serius',
    judul: 'Bleeding risk adds up',
    sebab: 'Two agents acting on haemostasis by different routes. The risk is additive and is not detected by INR alone.' },
  { a: 'risiko-perdarahan', b: 'antiplatelet', berat: 'perhatian',
    judul: 'Bleeding risk adds up',
    sebab: 'Platelet function is impaired further than either agent alone would.' },
  { a: 'hipoglikemik', b: 'hipoglikemik', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Blood glucose may fall further than intended',
    sebab: 'Both lower glucose. Monitoring matters more here than the combination being forbidden.' },
  { a: 'sedatif', b: 'sedatif', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Additive sedation',
    sebab: 'Drowsiness, falls and respiratory depression are worse in combination — particularly in older people.' },
  { a: 'serotonergik', b: 'serotonergik', berat: 'serius',
    judul: 'Serotonin syndrome risk',
    sebab: 'Agitation, tremor, hyperreflexia, fever and rigidity can develop within hours. It is a clinical diagnosis and can be fatal.' },
  { a: 'qt', b: 'qt', berat: 'serius',
    judul: 'QT prolongation adds up — torsades risk',
    sebab: 'Each agent lengthens repolarisation. Electrolyte disturbance makes it worse; an ECG is the way to see it.' },
  { a: 'kalium-turun', b: 'digoksin', berat: 'serius',
    judul: 'Digoxin toxicity risk from potassium loss',
    sebab: 'Low potassium markedly increases digoxin binding and toxicity, at digoxin levels that look acceptable.' },
  { a: 'kalium-turun', b: 'kalium-turun', berat: 'perhatian',
    judul: 'Potassium may fall further',
    sebab: 'Additive potassium loss, which itself raises arrhythmia risk.' },
  { a: 'kalium-naik', b: 'kalium-naik', berat: 'serius',
    judul: 'Hyperkalaemia risk',
    sebab: 'Both retain potassium. This is a common and preventable cause of dangerous hyperkalaemia, especially with reduced kidney function.' },
  { a: 'hepatotoksik', b: 'hepatotoksik', berat: 'perhatian',
    judul: 'Additive strain on the liver',
    sebab: 'Both have been associated with liver injury. Combined use warrants awareness and, where prolonged, monitoring.' },
  { a: 'nefrotoksik', b: 'nefrotoksik', berat: 'perhatian',
    judul: 'Additive strain on the kidneys',
    sebab: 'Combined nephrotoxic exposure, worse with dehydration.' },
  { a: 'nitrat', b: 'pde5', berat: 'serius',
    judul: 'Profound hypotension — this combination is contraindicated',
    sebab: 'The fall in blood pressure can be catastrophic. This applies to products adulterated with undeclared PDE5 inhibitors as well, which is why "herbal" does not make it safe.' },
  { a: 'levodopa', b: 'levodopa', berat: 'perhatian',
    judul: 'Additive dopaminergic effect',
    sebab: 'Dyskinesia, nausea and confusion. Preparations containing levodopa vary in content, so the total dose is unpredictable.' },
  { a: 'litium', b: 'kalium-turun', berat: 'serius',
    judul: 'Lithium levels may rise',
    sebab: 'Diuretics and fluid shifts raise lithium levels into the toxic range, and lithium toxicity can cause permanent neurological damage.' },
  { a: 'imunosupresan', b: 'imunosupresan', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Immune effects may oppose or add to each other',
    sebab: 'Herbal immunostimulants can oppose prescribed immunosuppression; the direction is not always predictable.' },
  { a: 'antihipertensi', b: 'antihipertensi', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Blood pressure may fall further than intended',
    sebab: 'Additive lowering. Dizziness and falls are the practical consequence.' },
]

export interface Butir {
  id: string
  nama: string
  jenis: 'obat' | 'herbal'
  tanda: Tanda[]
  keterangan: string
}

/** Semua yang bisa dipilih, obat dan herbal sekaligus. */
export function semuaButir(): Butir[] {
  const obat: Butir[] = semuaObat().map((x) => {
    const dariKelas = TANDA_KELAS.filter((t) => t.cocok.test(x.kelas)).flatMap((t) => t.tanda)
    const tanda = [...new Set([...dariKelas, ...(TANDA_ZAT[x.nama] ?? [])])]
    return { id: `o:${x.nama}`, nama: x.nama, jenis: 'obat', tanda, keterangan: x.kelas }
  })
  const herbal: Butir[] = semuaHerbal().map((h) => ({
    id: `h:${h.latin}`,
    nama: h.nama + (h.lokal ? ` · ${h.lokal}` : ''),
    jenis: 'herbal',
    tanda: TANDA_HERBAL[h.latin] ?? [],
    keterangan: h.latin,
  }))
  return [...obat, ...herbal]
}

export interface Temuan {
  a: Butir
  b: Butir
  berat: Berat
  judul: string
  sebab: string
}

/**
 * Silangkan daftarnya.
 *
 * Tiap pasangan diperiksa terhadap seluruh aturan; satu pasangan dapat
 * memunculkan lebih dari satu temuan, dan itu memang benar — dua obat bisa
 * bertemu lewat lebih dari satu jalan sekaligus.
 */
export function periksa(butir: Butir[]): Temuan[] {
  const hasil: Temuan[] = []
  for (let i = 0; i < butir.length; i++) {
    for (let j = i + 1; j < butir.length; j++) {
      const x = butir[i]
      const y = butir[j]
      const adaHerbal = x.jenis === 'herbal' || y.jenis === 'herbal'
      for (const r of ATURAN) {
        if (r.hanyaHerbal && !adaHerbal) continue
        const cocok =
          (x.tanda.includes(r.a) && y.tanda.includes(r.b)) ||
          (x.tanda.includes(r.b) && y.tanda.includes(r.a))
        if (!cocok) continue
        if (hasil.some((h) => h.judul === r.judul && ((h.a === x && h.b === y) || (h.a === y && h.b === x)))) continue
        hasil.push({ a: x, b: y, berat: r.berat, judul: r.judul, sebab: r.sebab })
      }
    }
  }
  // Yang serius lebih dahulu. Urutan pada layar peringatan adalah bagian dari
  // peringatannya sendiri.
  return hasil.sort((p, q) => (p.berat === q.berat ? 0 : p.berat === 'serius' ? -1 : 1))
}

export default periksa
