import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconShield } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// First Aid Quick Guide — plain-language emergency steps for bystanders, not
// clinicians (the clinician-facing ACLS/BLS algorithms already live in
// Clinical Calculators). Sourced from the standard lay-rescuer sequences
// taught in Red Cross / American Heart Association bystander courses:
// call for help first, then act. Pure static content, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Guide { id: string; title: string; emoji: string; category: string; whenToCall911: string; steps: string[]; doNot: string[] }

const GUIDES: Guide[] = [
  {
    id: 'choking',
    title: 'Tersedak (dewasa/anak, sadar)',
    emoji: '🫁',
    category: 'Airway',
    whenToCall911: 'Bila orangnya sama sekali tidak dapat batuk, berbicara, atau bernapas, atau menjadi tidak sadar.',
    steps: [
      'Tanyakan "Anda tersedak?" — bila ia masih dapat batuk kuat atau berbicara, doronglah ia terus batuk dan jangan campur tangan dulu.',
      'Bila ia tidak dapat bernapas, batuk, atau berbicara: berdirilah di belakangnya, condongkan badannya ke depan.',
      'Berikan 5 tepukan mantap di punggung, di antara kedua tulang belikat, dengan pangkal telapak tangan.',
      'Bila belum berhasil, berikan 5 hentakan perut (Heimlich): kepalkan tangan di atas pusar, genggam dengan tangan lain, tarik cepat ke dalam dan ke atas.',
      'Selang-seling 5 tepukan punggung dan 5 hentakan perut sampai bendanya keluar atau orangnya menjadi tidak sadar.',
      'Bila ia menjadi tidak sadar, baringkan ke lantai dan mulai RJP — segera hubungi layanan gawat darurat bila belum dilakukan.',
    ],
    doNot: ['Jangan melakukan hentakan perut pada bayi di bawah 1 tahun — pakailah tepukan punggung dan hentakan dada.', 'Jangan menyapu mulut dengan jari secara membabi buta kecuali bendanya terlihat.'],
  },
  {
    id: 'cpr',
    title: 'RJP dewasa (oleh orang awam)',
    emoji: '❤️',
    category: 'Cardiac',
    whenToCall911: 'Segera — bila Anda sendirian, teleponlah dulu sebelum memulai penekanan dada, baru mulai RJP.',
    steps: [
      'Periksa kesadarannya: tepuk bahunya dengan mantap dan panggil dengan keras. Periksa napas normal (tidak lebih dari 10 detik).',
      'Bila tidak sadar dan napasnya tidak normal, hubungi layanan gawat darurat (atau minta orang lain menelepon) dan ambil AED bila tersedia.',
      'Letakkan pangkal telapak satu tangan di tengah dada, tangan lain di atasnya, jari-jari saling mengunci.',
      'Tekan kuat dan cepat: sedalam sedikitnya 5 cm, 100-120 kali per menit, dan biarkan dada mengembang penuh di antara tiap penekanan.',
      'Bila terlatih dan bersedia, berikan 2 napas bantuan tiap 30 penekanan (30:2). Bila tidak terlatih atau tidak bersedia, teruskan RJP penekanan dada saja.',
      'Lanjutkan sampai AED datang (ikuti panduan suaranya), petugas mengambil alih, atau orangnya mulai bernapas normal.',
    ],
    doNot: ['Jangan menghentikan penekanan dada lebih dari 10 detik sekali berhenti.', 'Jangan melakukan RJP pada orang yang napasnya normal.'],
  },
  {
    id: 'bleeding',
    title: 'Perdarahan hebat',
    emoji: '🩸',
    category: 'Trauma',
    whenToCall911: 'Perdarahan apa pun yang tidak berhenti dengan penekanan langsung, darah yang menyembur, atau luka yang dalam/luas.',
    steps: [
      'Hubungi layanan gawat darurat bila perdarahannya hebat.',
      'Tekan luka dengan mantap dan langsung memakai kain bersih atau perban — jangan dilepas bila tembus darah, tambahkan lapisan di atasnya.',
      'Bila memungkinkan, angkat bagian yang terluka lebih tinggi dari jantung.',
      'Bila perdarahan berlanjut meski sudah ditekan langsung dan lukanya di anggota gerak, pasang torniket beberapa sentimeter di atas luka (bukan di atas sendi), kencangkan sampai perdarahan berhenti. Catat jam pemasangannya.',
      'Jaga orangnya tetap hangat dan tidak banyak bergerak untuk mengurangi risiko syok.',
    ],
    doNot: ['Jangan mencabut benda yang menancap — ganjal di sekelilingnya dan tekan di tepinya.', 'Jangan mengendurkan torniket yang sudah terpasang kecuali atas arahan petugas medis.'],
  },
  {
    id: 'burns',
    title: 'Luka bakar',
    emoji: '🔥',
    category: 'Trauma',
    whenToCall911: 'Luka bakar yang lebih luas dari telapak tangan orangnya, mengenai wajah/tangan/kemaluan, luka dalam/hangus, atau akibat bahan kimia/listrik.',
    steps: [
      'Jauhkan orangnya dari sumber panas dan lepaskan perhiasan/pakaian ketat di dekat luka sebelum pembengkakan mulai.',
      'Dinginkan luka di bawah air mengalir yang sejuk (bukan sedingin es) selama 20 menit.',
      'Tutup longgar dengan penutup luka bersih yang tidak lengket atau plastik pembungkus.',
      'Pada luka bakar bahan kimia, sapu dulu bahan kimia keringnya, lalu siram dengan air mengalir banyak sedikitnya 20 menit.',
      'Tangani sebagai syok (baringkan, angkat tungkai, jaga kehangatan) bila luka bakarnya luas.',
    ],
    doNot: ['Jangan mengoleskan es, mentega, minyak, atau pasta gigi pada luka bakar.', 'Jangan memecahkan lepuh.', 'Jangan menarik pakaian yang melekat pada luka bakar.'],
  },
  {
    id: 'seizure',
    title: 'Kejang',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'Kejang pertama kali seumur hidup, berlangsung lebih dari 5 menit, kejang berikutnya datang sebelum pulih, ada cedera saat kejang, sesak napas sesudahnya, atau orangnya sedang hamil/diabetes/diketahui bukan penyandang epilepsi.',
    steps: [
      'Tetap tenang dan hitung lama kejangnya.',
      'Singkirkan benda keras/tajam di sekitarnya untuk mencegah cedera; jangan menahan gerakannya.',
      'Letakkan sesuatu yang lembut di bawah kepalanya.',
      'Setelah kejangnya berhenti, miringkan tubuhnya (posisi pemulihan) agar jalan napas tetap bebas.',
      'Temani sampai ia benar-benar sadar penuh; bicaralah dengan tenang saat kesadarannya kembali.',
    ],
    doNot: ['Jangan memasukkan apa pun ke dalam mulutnya.', 'Jangan berusaha menahan tubuhnya.', 'Jangan memberi minum atau makan sebelum ia sadar penuh.'],
  },
  {
    id: 'fainting',
    title: 'Pingsan',
    emoji: '💫',
    category: 'General',
    whenToCall911: 'Tidak sadar kembali dalam satu menit, cedera akibat jatuh, nyeri dada, denyut jantung tidak teratur, atau orangnya sedang hamil/lanjut usia.',
    steps: [
      'Baringkan orangnya mendatar dan angkat tungkainya sekitar 30 cm agar aliran darah ke otak membaik.',
      'Longgarkan pakaian yang ketat di leher/pinggang.',
      'Periksa napasnya; bila tidak bernapas normal, mulai RJP dan hubungi layanan gawat darurat.',
      'Setelah siuman, biarkan ia berbaring beberapa menit sebelum perlahan didudukkan.',
    ],
    doNot: ['Jangan mendudukkan atau membangunkan orangnya dengan cepat.', 'Jangan memberi makan atau minum sebelum ia sadar penuh.'],
  },
  {
    id: 'stroke',
    title: 'Dugaan stroke (FAST)',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'Salah satu tanda FAST, meskipun kemudian menghilang — segera telepon, catat jam gejalanya mulai.',
    steps: [
      'F — Face (wajah): minta ia tersenyum. Apakah satu sisi turun?',
      'A — Arms (lengan): minta ia mengangkat kedua lengan. Apakah salah satu melorot?',
      'S — Speech (bicara): minta ia mengulang satu kalimat. Apakah pelo atau aneh?',
      'T — Time (waktu): bila ada satu tanda saja, segera hubungi layanan gawat darurat dan catat jam persis gejalanya mulai (ini menentukan pilihan pengobatannya).',
      'Jaga orangnya tetap tenang, duduk atau berbaring dengan kepala sedikit ditinggikan, dan jangan beri makan atau minum (kemampuan menelannya bisa terganggu).',
    ],
    doNot: ['Jangan menunggu gejalanya membaik sebelum meminta pertolongan — tiap menit berarti bagi jaringan otak.', 'Jangan memberi aspirin atau obat apa pun tanpa arahan medis.'],
  },
  {
    id: 'allergic',
    title: 'Severe allergic reaction (anaphylaxis)',
    emoji: '⚠️',
    category: 'Allergic',
    whenToCall911: 'Tanda sesak napas apa pun, pembengkakan wajah/tenggorokan, biduran luas disertai pusing, atau paparan alergen yang diketahui berat.',
    steps: [
      'Call emergency services immediately.',
      'Bila orangnya punya penyuntik otomatis epinefrin (mis. EpiPen), bantu ia memakainya — suntikkan di paha sisi luar, tahan selama waktu yang tertera pada alatnya.',
      'Baringkan mendatar dengan tungkai diangkat (kecuali bila ia sesak napas, biarkan ia duduk).',
      'Dosis kedua epinefrin dapat diberikan sesudah 5-15 menit bila gejalanya tidak membaik dan tersedia penyuntik otomatis lain.',
      'Begin CPR if they stop breathing or become unresponsive.',
    ],
    doNot: ['Jangan menunggu gejalanya membaik sebelum memakai epinefrin bila obatnya tersedia dan anafilaksis dicurigai.', 'Jangan menyuruhnya berdiri atau berjalan mendadak — ini dapat memperburuk penurunan tekanan darah.'],
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(GUIDES.map((g) => g.category)))]

export function FirstAidGuide() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState<string | null>(null)
  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () => GUIDES.filter((g) => (cat === 'All' || g.category === cat) && (!q || (g.title + g.category).toLowerCase().includes(q))),
    [q, cat],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Panduan Cepat Pertolongan Pertama" subtitle="Langkah gawat darurat dengan bahasa sederhana untuk orang di sekitar" />
        <p className="mt-2 text-[13px] leading-relaxed text-red-600 dark:text-red-300">
          <b>Ini tidak menggantikan panggilan ke layanan gawat darurat.</b> Dalam keadaan gawat darurat sungguhan,
          mintalah pertolongan lebih dahulu (atau minta orang lain menelepon) — langkah-langkah di sini adalah apa yang
          dikerjakan selagi pertolongan dalam perjalanan, mengikuti panduan pertolongan pertama untuk orang awam dari
          Palang Merah / AHA.
        </p>
        <input className={`${inputClass} mt-3`} placeholder="Cari: tersedak, perdarahan, kejang…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-500">No guide matches "{query}".</Card>}

      {filtered.map((g) => {
        const isOpen = open === g.id
        return (
          <Card key={g.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : g.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl dark:bg-red-500/10">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-ink dark:text-ink">{g.title}</div>
                <Badge tone="low">{g.category}</Badge>
              </div>
              <span className="shrink-0 text-neutral-300">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 p-4 dark:border-white/10">
                <div className="rounded-xl bg-red-50 p-3 text-[12px] leading-relaxed text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  <b>Hubungi layanan gawat darurat bila:</b> {g.whenToCall911}
                </div>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-500">Steps</div>
                <ol className="mt-1.5 list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-500">Do not</div>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-500">
                  {g.doNot.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </Card>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Mengikuti urutan baku penolong awam (panduan Palang Merah / American Heart Association untuk orang di sekitar).
        Rujukan untuk belajar saja — ikutilah pelatihan pertolongan pertama / RJP bersertifikat untuk latihan langsung,
        dan dalam keadaan gawat darurat sungguhan selalu hubungi nomor darurat setempat.
      </div>
    </div>
  )
}

export default FirstAidGuide
