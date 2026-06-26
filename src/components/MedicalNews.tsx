import { useMemo } from 'react'

// Curated, factual medical-innovation news (stem-cell, CRISPR, devices, AI, Nobel,
// mutation, longevity). Rotates a fresh subset each load so it always feels new.
// To go fully live later, swap NEWS for a fetch to a news/RSS or PubMed endpoint.
interface NewsItem { tag: string; title: string; detail: string }

const NEWS: NewsItem[] = [
  { tag: 'CRISPR', title: 'Terapi gen CRISPR pertama disetujui', detail: 'Casgevy (exa-cel) — penyuntingan gen CRISPR/Cas9 untuk anemia sel sabit & beta-talasemia, menandai era terapi genetik klinis.' },
  { tag: 'CRISPR', title: 'Base & prime editing masuk uji klinis', detail: 'Penyuntingan presisi satu-huruf DNA mulai diuji untuk hiperkolesterolemia & penyakit metabolik bawaan.' },
  { tag: 'Sel Punca', title: 'Sel islet dari stem cell sembuhkan diabetes tipe-1', detail: 'Uji klinis sel penghasil insulin turunan stem cell menunjukkan kemandirian insulin pada sebagian pasien.' },
  { tag: 'Longevity', title: 'Reprogram epigenetik "meremajakan" sel', detail: 'Faktor Yamanaka parsial memulihkan penanda usia sel di praklinis — inti riset memperpanjang healthspan.' },
  { tag: 'AI', title: 'AlphaFold memetakan jutaan struktur protein', detail: 'AI memprediksi struktur & interaksi protein (AlphaFold 3), mempercepat penemuan obat secara dramatis.' },
  { tag: 'Nobel', title: 'Nobel Kedokteran: mRNA & microRNA', detail: '2023 — Karikó & Weissman (mRNA termodifikasi); 2024 — Ambros & Ruvkun (microRNA), fondasi terapi presisi.' },
  { tag: 'Metabolik', title: 'Obat GLP-1 lampaui penurunan berat', detail: 'Semaglutide/tirzepatide menunjukkan manfaat jantung, ginjal kronik, & apnea tidur — bukan sekadar obesitas.' },
  { tag: 'Neuro', title: 'Anti-amiloid memperlambat Alzheimer', detail: 'Lecanemab & donanemab memperlambat penurunan kognitif tahap awal — terobosan pertama dalam dekade.' },
  { tag: 'Devices', title: 'Wearable jadi alat skrining', detail: 'CGM tanpa resep, EKG/AFib di jam tangan, & sensor SpO₂ membawa deteksi dini ke pergelangan tangan.' },
  { tag: 'Mutasi', title: 'Sekuensing genom makin murah & cepat', detail: 'Genom utuh kini hitungan jam & ratusan dolar — membuka skrining mutasi & onkologi presisi massal.' },
  { tag: 'AI-EMR', title: 'Dokumentasi klinis ambient dengan AI', detail: 'AI menyusun catatan medis dari percakapan dokter–pasien, mengurangi burnout & menambah waktu tatap pasien.' },
  { tag: 'Onkologi', title: 'Vaksin kanker mRNA personal', detail: 'Vaksin mRNA disesuaikan tumor tiap pasien menunjukkan respons menjanjikan pada melanoma & pankreas.' },
]

const QUOTES: { q: string; who: string }[] = [
  { q: 'Penyuntingan gen memberi kita kekuatan untuk menulis ulang kode kehidupan — dengan itu datang tanggung jawab besar.', who: 'Jennifer Doudna · Nobel Kimia, penemu CRISPR' },
  { q: 'AI dapat mempercepat penemuan ilmiah dari dekade menjadi tahun.', who: 'Demis Hassabis · DeepMind, Nobel Kimia 2024' },
  { q: 'Penuaan bukan takdir yang mutlak — ia adalah proses yang bisa dipahami dan diperlambat.', who: 'David Sinclair · Genetika, Harvard' },
  { q: 'Tujuan kedokteran bukan memperpanjang umur saja, tetapi memperpanjang masa sehat.', who: 'Peter Attia · Kedokteran longevity' },
  { q: 'Data + AI mengembalikan empati ke kedokteran dengan memberi dokter waktu untuk pasien.', who: 'Eric Topol · Kardiolog, Scripps' },
  { q: 'Tubuh adalah sistem yang bisa diukur, dipahami, dan dioptimalkan.', who: 'Filosofi Quantified-Self / Longevity' },
  { q: 'Mencegah lebih murah, lebih manusiawi, dan lebih kuat daripada mengobati.', who: 'Prinsip Kesehatan Masyarakat Modern' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MedicalNews() {
  // Pick a fresh subset on each mount so the section "keeps updating".
  const items = useMemo(() => shuffle(NEWS).slice(0, 6), [])
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])

  return (
    <section className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Berita & Inovasi</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Teknologi Kedokteran Terkini</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-500">Stem-cell · CRISPR · perangkat · mutasi · AI-EMR · Nobel — berganti setiap kali Anda berkunjung.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <div key={n.title} className="group h-full rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-md">
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-dark">{n.tag}</span>
              <h3 className="mt-3 font-bold leading-snug">{n.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{n.detail}</p>
            </div>
          ))}
        </div>

        <blockquote className="mx-auto mt-8 max-w-3xl rounded-2xl bg-gradient-to-br from-[#0b7a4b] to-[#00BF63] p-6 text-center text-white">
          <p className="text-lg font-semibold italic leading-relaxed">“{quote.q}”</p>
          <footer className="mt-3 text-sm font-bold text-white/80">— {quote.who}</footer>
        </blockquote>
      </div>
    </section>
  )
}
