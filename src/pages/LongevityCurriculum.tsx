import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'

// Physician-led longevity medicine curriculum — an educational overview of
// the major domains, each tagged by evidence maturity (Established / Emerging
// / Experimental) so a clinician can calibrate how much weight to give each
// topic. This is curriculum/orientation content, not a prescribing guide —
// several domains here (peptides, hormone optimization) have significant
// gray-market misuse outside licensed supervision, which each module flags
// explicitly rather than glossing over.

type Evidence = 'established' | 'emerging' | 'experimental'
const evidenceLabel: Record<Evidence, { l: string; tone: 'normal' | 'low' | 'critical' }> = {
  established: { l: 'Established — bukti kuat, dipakai klinis rutin', tone: 'normal' },
  emerging: { l: 'Emerging — bukti berkembang, indikasi meluas', tone: 'low' },
  experimental: { l: 'Experimental — belum terbukti kuat, hanya via uji klinis/pengawasan ketat', tone: 'critical' },
}

interface Module {
  key: string
  icon: string
  title: string
  evidence: Evidence
  summary: string
  keyPoints: string[]
  caution?: string
  references: string[]
}

const MODULES: Module[] = [
  {
    key: 'stemcell', icon: '🧬', title: 'Sel Punca & Kedokteran Regeneratif', evidence: 'experimental',
    summary: 'Penggunaan sel punca mesenkimal (MSC), produk turunannya (eksosom), dan terapi regeneratif lain untuk perbaikan jaringan & modulasi inflamasi.',
    keyPoints: [
      'Indikasi FDA-approved sangat terbatas (mis. transplantasi sel punca hematopoietik untuk keganasan darah) — mayoritas aplikasi "anti-aging"/regeneratif lain masih investigasional.',
      'Eksosom & produk sel punca "siap pakai" yang dipasarkan klinik anti-aging umumnya BELUM melalui uji klinis fase III terkontrol untuk klaim tersebut.',
      'Risiko nyata: infeksi, respons imun tak terduga, dan kasus tumor akibat produk tidak teregulasi telah dilaporkan (FDA warning letters).',
    ],
    caution: 'Rujuk pasien HANYA ke uji klinis terdaftar (mis. ClinicalTrials.gov) atau fasilitas dengan izin regulator resmi (BPOM/FDA) — hindari klinik yang mengklaim terapi sel punca "anti-aging" tanpa dasar uji klinis terpublikasi.',
    references: ['FDA. Public Safety Notification on Stem Cell Therapies.', 'Galipeau J & Sensébé L. Mesenchymal Stromal Cells: Clinical Challenges and Therapeutic Opportunities. Cell Stem Cell 2018.'],
  },
  {
    key: 'robotics', icon: '🤖', title: 'Robotika Medis', evidence: 'established',
    summary: 'Bedah berbantuan robot (mis. sistem da Vinci), eksoskeleton rehabilitasi, dan AI diagnostik sebagai perpanjangan presisi kemampuan klinisi.',
    keyPoints: [
      'Bedah robotik terbukti mengurangi kehilangan darah & lama rawat pada prostatektomi, histerektomi, dan bedah kolorektal tertentu — namun biaya tinggi & kurva belajar signifikan.',
      'Eksoskeleton rehabilitasi (mis. pasca-stroke, cedera medula spinalis) menunjukkan perbaikan fungsi gait pada studi terkontrol skala menengah.',
      'AI diagnostik (radiologi, patologi digital) sudah mendapat izin regulator (FDA-cleared) untuk tugas spesifik (mis. deteksi nodul paru, retinopati diabetik) — bukan pengganti keputusan klinis akhir.',
    ],
    references: ['Ficarra V, et al. Robot-assisted vs open radical prostatectomy meta-analysis. Eur Urol.', 'Esquenazi A, et al. Powered exoskeletons for gait rehab post-stroke. Am J Phys Med Rehabil.'],
  },
  {
    key: 'sglt2', icon: '💊', title: 'SGLT2 Inhibitor', evidence: 'established',
    summary: 'Penghambat sodium-glucose cotransporter-2 (mis. dapagliflozin, empagliflozin) — awalnya obat diabetes, kini dengan bukti manfaat kardio-renal luas.',
    keyPoints: [
      'Indikasi established: DM tipe 2, gagal jantung (HFrEF & HFpEF), penyakit ginjal kronis — menurunkan rawat inap gagal jantung & progresi CKD independen dari efek gula darah.',
      'Mekanisme longevity yang diminati: natriuresis ringan, penurunan preload/afterload jantung, kemungkinan efek anti-inflamasi & metabolik yang lebih luas.',
      'Minat penggunaan "off-label" untuk populasi non-diabetes/non-HF demi manfaat kardiometabolik masih emerging — belum ada indikasi resmi untuk populasi sehat sebagai "obat anti-penuaan".',
    ],
    references: ['McMurray JJV, et al. DAPA-HF Trial. N Engl J Med 2019.', 'Heerspink HJL, et al. DAPA-CKD Trial. N Engl J Med 2020.'],
  },
  {
    key: 'ai', icon: '🖥️', title: 'AI & Teknologi dalam Longevity', evidence: 'emerging',
    summary: 'Wearable, algoritma usia biologis, dan clinical decision support berbasis AI sebagai alat pemantauan & prediksi risiko kesehatan jangka panjang.',
    keyPoints: [
      'Wearable (HRV, VO2max estimasi, tidur) memberi data longitudinal berguna untuk tren personal — namun akurasi absolut bervariasi antar perangkat & belum menggantikan pengukuran klinis baku emas.',
      '"Usia biologis" dari jam epigenetik (mis. Horvath clock, GrimAge, PhenoAge) berkorelasi dengan mortalitas dalam studi kohort besar, namun belum ada konsensus klinis tentang cara intervensi berdasarkan skor ini secara individual.',
      'AI clinical decision support (skrining risiko, triase) meningkatkan efisiensi namun tetap memerlukan validasi lokal & pengawasan klinisi — bias algoritma adalah risiko nyata bila data latih tidak representatif.',
    ],
    references: ['Horvath S. DNA methylation age of human tissues and cell types. Genome Biol 2013.', 'Levine ME, et al. An epigenetic biomarker of aging for lifespan and healthspan (PhenoAge). Aging (Albany NY) 2018.'],
  },
  {
    key: 'peptides', icon: '🧪', title: 'Peptida Terapeutik', evidence: 'experimental',
    summary: 'Molekul peptida pendek yang menargetkan reseptor spesifik — mencakup kelas established (mis. analog GLP-1) hingga peptida "longevity" gray-market (BPC-157, epithalon, dll).',
    keyPoints: [
      'Analog GLP-1/GIP (semaglutide, tirzepatide) adalah peptida dengan bukti kuat untuk DM tipe 2 & obesitas — kelas ini established, bukan eksperimental.',
      'Peptida yang dipasarkan luas untuk "anti-aging"/pemulihan jaringan (BPC-157, TB-500, epithalon, dll.) sebagian besar HANYA memiliki data praklinis (hewan/in-vitro) — data keamanan & efikasi manusia terkontrol sangat terbatas atau tidak ada.',
      'Status regulasi banyak peptida ini adalah "research chemical", BUKAN obat berizin edar untuk manusia di sebagian besar yurisdiksi termasuk Indonesia (BPOM).',
    ],
    caution: 'Jangan meresepkan atau merekomendasikan peptida gray-market tanpa dasar uji klinis terpublikasi & izin edar resmi — risiko kontaminasi produk, dosis tidak terstandardisasi, dan efek samping tidak terprediksi pada suplai non-farmasi.',
    references: ['Sikirić P, et al. Pentadecapeptide BPC 157: review of preclinical evidence. Curr Pharm Des.', 'Wilding JPH, et al. Semaglutide for weight management (STEP trials). N Engl J Med 2021.'],
  },
  {
    key: 'hormones', icon: '⚗️', title: 'Optimalisasi Hormon', evidence: 'emerging',
    summary: 'Terapi pengganti hormon (menopause, andropause, tiroid subklinis) dalam konteks longevity — menyeimbangkan manfaat kualitas hidup dengan risiko jangka panjang.',
    keyPoints: [
      'TSH (terapi sulih hormon) menopause: aman & efektif untuk gejala vasomotor pada wanita <60 tahun/dalam 10 tahun menopause tanpa kontraindikasi (WHI reanalysis) — timing matters.',
      'Terapi testosteron pada pria dengan hipogonadisme terkonfirmasi (bukan sekadar "low-normal" tanpa gejala) memperbaiki gejala, namun efek kardiovaskular jangka panjang masih diperdebatkan (TRAVERSE trial memberi data reassuring namun bukan tanpa nuansa).',
      'Optimalisasi hormon "preventif" pada individu tanpa defisiensi terdiagnosis TIDAK didukung bukti kuat & berisiko efek samping (eritrositosis, risiko tromboemboli, supresi aksis endogen).',
    ],
    references: ['Manson JE, et al. WHI hormone therapy trials long-term follow-up. JAMA.', 'Bhasin S, et al. TRAVERSE Trial: testosterone and cardiovascular safety. N Engl J Med 2023.'],
  },
  {
    key: 'cardio', icon: '❤️', title: 'Longevity & Kesehatan Kardiovaskular', evidence: 'established',
    summary: 'Penyakit kardiovaskular tetap penyebab kematian utama global — intervensi berbasis bukti di sini memberi dampak terbesar pada healthspan.',
    keyPoints: [
      'Statin & PCSK9 inhibitor menurunkan LDL & kejadian kardiovaskular mayor secara konsisten pada RCT skala besar — pilar utama pencegahan kardiovaskular berbasis bukti.',
      'Faktor gaya hidup (aktivitas fisik, diet pola Mediterania/DASH, berhenti merokok, tidur cukup) memberi dampak longevity yang sama pentingnya, dengan bukti epidemiologis & RCT (PREDIMED, dll).',
      'Biomarker seperti Lp(a) & kalsium skor koroner (CAC) membantu stratifikasi risiko individual di luar kalkulator risiko standar (ASCVD).',
    ],
    references: ['Cholesterol Treatment Trialists Collaboration. Efficacy of statin therapy meta-analysis. Lancet.', 'Estruch R, et al. PREDIMED Trial — Mediterranean diet. N Engl J Med 2018.'],
  },
  {
    key: 'biomarkers', icon: '🔬', title: 'Biomarker Endpoint Longevity', evidence: 'emerging',
    summary: 'Penanda biologis yang dipakai sebagai proxy "kesehatan jangka panjang" — penting dipahami mana yang tervalidasi vs masih riset.',
    keyPoints: [
      'VO2max & HRV: prediktor mortalitas & morbiditas yang tervalidasi kuat dalam studi kohort besar — biomarker fungsional paling actionable saat ini.',
      'hsCRP & penanda inflamasi kronis (inflammaging): berkorelasi dengan risiko kardiovaskular & metabolik, dipakai stratifikasi risiko klinis (mis. JUPITER trial untuk statin).',
      'Jam epigenetik & panjang telomer: berkorelasi populasi-level dengan penuaan biologis, namun BELUM ada endpoint yang disetujui regulator untuk uji klinis obat anti-penuaan individual — area riset aktif, bukan alat diagnostik klinis rutin.',
    ],
    references: ['Ross R, et al. Importance of assessing cardiorespiratory fitness in clinical practice (AHA Scientific Statement). Circulation 2016.', 'Ridker PM, et al. JUPITER Trial — hsCRP-guided statin therapy. N Engl J Med 2008.'],
  },
  {
    key: 'research', icon: '🏛️', title: 'Infrastruktur Riset Klinis', evidence: 'established',
    summary: 'Kerangka metodologis yang memastikan klaim longevity medicine dapat dipercaya — hierarki bukti, desain uji klinis, dan jalur regulasi.',
    keyPoints: [
      'Hierarki bukti: meta-analisis RCT > RCT tunggal > kohort prospektif > studi kasus-kontrol > laporan kasus/opini ahli — sebagian besar klaim "longevity" populer berhenti di level bawah hierarki ini.',
      'Desain RCT longevity menghadapi tantangan unik: endpoint keras (kematian) butuh puluhan tahun follow-up, sehingga biomarker pengganti (surrogate endpoints) dipakai — namun validitasnya harus dibuktikan berkorelasi dengan outcome keras.',
      'Jalur regulasi (FDA, EMA, BPOM) mensyaratkan bukti keamanan & efikasi sebelum klaim indikasi dipasarkan — produk yang menghindari jalur ini (suplemen/"research chemical") tidak melalui pengawasan setara obat.',
    ],
    references: ['Sackett DL, et al. Evidence based medicine: what it is and what it isn\'t. BMJ 1996.', 'Kaeberlein M. The biology of aging: citable classic papers and study of longevity interventions. Elife.'],
  },
]

export function LongevityCurriculum() {
  const [openKey, setOpenKey] = useState<string | null>('stemcell')

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <SectionTitle
        icon={<IconHeart size={20} />}
        title="Kurikulum Longevity Medicine"
        subtitle="Ringkasan berjenjang untuk klinisi/institusi — sel punca, robotika, SGLT2i, AI, peptida, hormon, kardiovaskular, biomarker & infrastruktur riset"
      />
      <p className="text-[12px] leading-relaxed text-neutral-500">
        Setiap modul ditandai tingkat kematangan bukti. Ini adalah materi edukasi/orientasi untuk klinisi, <b>bukan panduan resep</b> —
        beberapa topik (peptida, optimalisasi hormon) memiliki risiko penyalahgunaan gray-market yang nyata di luar pengawasan
        profesional berlisensi, dan modul terkait menyatakan ini secara eksplisit.
      </p>

      <div className="space-y-3">
        {MODULES.map((m) => {
          const open = openKey === m.key
          const ev = evidenceLabel[m.evidence]
          return (
            <Card key={m.key} className="!p-0 overflow-hidden">
              <button
                onClick={() => setOpenKey(open ? null : m.key)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-ink">{m.title}</div>
                  <Badge tone={ev.tone}>{ev.l}</Badge>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {open && (
                <div className="border-t border-black/5 p-4 pt-3">
                  <p className="text-[12px] leading-relaxed text-neutral-600">{m.summary}</p>
                  <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-neutral-600">
                    {m.keyPoints.map((k, i) => <li key={i}>• {k}</li>)}
                  </ul>
                  {m.caution && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                      <p className="text-[11px] font-black text-amber-800">⚠️ Catatan Keamanan</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{m.caution}</p>
                    </div>
                  )}
                  <div className="mt-3 rounded-xl bg-neutral-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Referensi</div>
                    <ul className="mt-1 space-y-1 text-[10px] leading-relaxed text-neutral-500">
                      {m.references.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-center text-[10px] leading-relaxed text-neutral-400">
        Sitasi di halaman ini adalah rujukan landmark yang mendasari setiap topik — verifikasi detail (DOI, volume, edisi terbaru)
        langsung di PubMed/penerbit untuk keperluan akademik formal. Materi ini disusun untuk orientasi klinisi/institusi
        pendidikan, bukan pengganti tinjauan literatur sistematis atau pedoman spesialisasi resmi.
      </p>
    </div>
  )
}

export default LongevityCurriculum
