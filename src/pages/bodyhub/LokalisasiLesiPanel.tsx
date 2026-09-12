import { lazy, Suspense, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'

// 3D dimuat hanya saat panel ini dibuka; ia membawa three.js dan nervous.glb.
const LesiNeuro3D = lazy(() => import('./LesiNeuro3D').then((m) => ({ default: m.LesiNeuro3D })))
import {
  lokalisasi, tempatTerbaik, NAMA_TINGKAT, TINGKAT_SARAF_KRANIAL, DI_LUAR_MODEL,
  type Temuan, type TemuanSarafKranial, type Modalitas, type Sisi, type Wilayah,
} from '../../lib/lokalisasiLesi'

// Panel lokalisasi lesi untuk Body Exposure.
//
// Keputusan rancangan yang paling menentukan: TUTORIALNYA ADALAH ALATNYA.
//
// Panduan "Start here" yang sudah ada menyebutkan nama-nama tab. Membaca nama
// tab tidak mengajarkan keterampilan apa pun. Di sini, menekan sebuah kasus
// terpandu benar-benar MENGISI temuan pada alat yang sama, lalu jawabannya
// muncul beserta alasannya. Yang dipelajari adalah penalarannya, dan yang
// dipakai untuk mempelajarinya adalah alat yang sama yang akan dipakai
// sesudahnya -- bukan tur yang menunjuk-nunjuk lalu hilang.

const MODALITAS: Array<{ id: Modalitas; label: string; jalur: string }> = [
  { id: 'motorik', label: 'Weakness', jalur: 'Corticospinal — crosses at the medullary pyramids' },
  { id: 'nyeri-suhu', label: 'Pain / temperature', jalur: 'Spinothalamic — crosses inside the cord, near entry' },
  { id: 'getar-posisi', label: 'Vibration / position', jalur: 'Dorsal column — crosses in the medulla' },
]

interface KasusTerpandu {
  judul: string
  ajakan: string
  temuan: Temuan[]
  saraf: TemuanSarafKranial[]
  pelajaran: string
}

// Kasus ini TIDAK memuat jawabannya. Ia hanya memuat temuan; jawabannya tetap
// dihitung mesin dari aturan penyilangan, sama seperti masukan pengguna. Kalau
// jawabannya ditulis di sini, tutorialnya akan tetap "benar" bahkan setelah
// mesinnya rusak -- dan itu justru kebalikan dari mengajar.
const KASUS: KasusTerpandu[] = [
  {
    judul: 'Case 1 · Two sides at once',
    ajakan: 'Weakness and vibration loss on the right, pain and temperature loss on the left.',
    temuan: [
      { modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' },
      { modalitas: 'getar-posisi', sisi: 'kanan', wilayah: 'badan' },
      { modalitas: 'nyeri-suhu', sisi: 'kiri', wilayah: 'badan' },
    ],
    saraf: [],
    pelajaran: 'Three tracts, three different crossing points. Only below the medulla are the motor '
      + 'and dorsal column fibres still on their own side while the spinothalamic fibres have already '
      + 'crossed — so this split pattern has exactly one home.',
  },
  {
    judul: 'Case 2 · Face one way, body the other',
    ajakan: 'Pain and temperature lost on the left face and the right body.',
    temuan: [
      { modalitas: 'nyeri-suhu', sisi: 'kiri', wilayah: 'wajah' },
      { modalitas: 'nyeri-suhu', sisi: 'kanan', wilayah: 'badan' },
    ],
    saraf: [{ saraf: 9, sisi: 'kiri' }],
    pelajaran: 'A crossed face-body pattern is the signature of the brainstem, because that is the '
      + 'only place where an ipsilateral cranial nerve nucleus sits beside an already-crossed body '
      + 'tract. Above or below it, face and body go the same way.',
  },
  {
    judul: 'Case 3 · Let the cranial nerve set the level',
    ajakan: 'Right-sided weakness with a left third nerve palsy — then switch the nerve to VII.',
    temuan: [{ modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' }],
    saraf: [{ saraf: 3, sisi: 'kiri' }],
    pelajaran: 'Contralateral weakness alone only says "above the pyramids" — it cannot pick a level. '
      + 'The cranial nerve does that, because its nucleus has an address. Change III to VII below and '
      + 'watch the answer move from midbrain to pons.',
  },
]

function Cip({ aktif, onClick, anak }: { aktif: boolean; onClick: () => void; anak: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={aktif}
      className={`min-h-[34px] rounded-full border px-3 text-[11px] font-bold transition ${
        aktif
          ? 'border-brand/50 bg-brand/15 text-brand-dark dark:text-brand'
          : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}>
      {anak}
    </button>
  )
}

export function LokalisasiLesiPanel() {
  const [temuan, setTemuan] = useState<Temuan[]>([])
  const [saraf, setSaraf] = useState<TemuanSarafKranial[]>([])
  const [pelajaran, setPelajaran] = useState<string | null>(null)

  const hasil = useMemo(() => lokalisasi(temuan, saraf), [temuan, saraf])
  const terbaik = tempatTerbaik(hasil)
  const adaTemuan = temuan.length > 0 || saraf.length > 0

  function alihkan(modalitas: Modalitas, sisi: Sisi, wilayah: Wilayah) {
    setPelajaran(null)
    setTemuan((t) => {
      const ada = t.findIndex((x) => x.modalitas === modalitas && x.sisi === sisi && x.wilayah === wilayah)
      if (ada >= 0) return t.filter((_, i) => i !== ada)
      return [...t, { modalitas, sisi, wilayah }]
    })
  }

  function alihkanSaraf(nomor: number, sisi: Sisi) {
    setPelajaran(null)
    setSaraf((s) => {
      const ada = s.findIndex((x) => x.saraf === nomor && x.sisi === sisi)
      if (ada >= 0) return s.filter((_, i) => i !== ada)
      return [...s.filter((x) => x.saraf !== nomor), { saraf: nomor, sisi }]
    })
  }

  function jalankanKasus(k: KasusTerpandu) {
    setTemuan(k.temuan)
    setSaraf(k.saraf)
    setPelajaran(k.pelajaran)
  }

  const punya = (m: Modalitas, s: Sisi, w: Wilayah) =>
    temuan.some((t) => t.modalitas === m && t.sisi === s && t.wilayah === w)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Where is the lesion?</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Enter a pattern of deficits and this works out where a single lesion would have to be, from
          where each tract crosses. It reasons from the pattern you type — it is not a diagnosis, and it
          never looks at a patient.
        </Prosa>
      </div>

      <Suspense fallback={<div className="h-[280px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        {/* Tanpa satu pun temuan, `lokalisasi` masih mengembalikan kandidat:
            setiap tempat "menjelaskan" nol temuan dengan sama baiknya. Menyorot
            kandidat pertama dari daftar itu akan menampilkan tempat lesi pada
            model sebelum ada yang dimasukkan. Dulu ini tidak terlihat karena
            viewer-nya gagal mengikat mesh bersisi; ia terlihat begitu ikatannya
            diperbaiki. Jadi yang disorot hanya disebut saat ADA temuan. */}
        <LesiNeuro3D
          tingkat={adaTemuan ? terbaik?.tingkat ?? null : null}
          sisi={adaTemuan ? terbaik?.sisi ?? null : null}
        />
      </Suspense>

      {/* Tutorial: kasus yang benar-benar menjalankan alatnya. */}
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Learn by running one</p>
        <div className="mt-2 grid gap-1.5">
          {KASUS.map((k) => (
            <button key={k.judul} type="button" onClick={() => jalankanKasus(k)}
              className="rounded-xl bg-white/75 p-2.5 text-left transition hover:bg-white dark:bg-white/[.055] dark:hover:bg-white/[.09]">
              <div className="text-[11.5px] font-black text-ink dark:text-white">{k.judul}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{k.ajakan}</div>
            </button>
          ))}
        </div>
        {pelajaran && (
          <p className="mt-2 rounded-xl bg-white/80 p-2.5 text-[11.5px] leading-relaxed text-neutral-700 dark:bg-white/[.06] dark:text-neutral-200">
            {pelajaran}
          </p>
        )}
      </div>

      {/* Masukan temuan */}
      {MODALITAS.map((m) => (
        <div key={m.id} className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
          <p className="text-[11.5px] font-black text-ink dark:text-white">{m.label}</p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-neutral-500">{m.jalur}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Cip aktif={punya(m.id, 'kiri', 'badan')} onClick={() => alihkan(m.id, 'kiri', 'badan')} anak="Left body" />
            <Cip aktif={punya(m.id, 'kanan', 'badan')} onClick={() => alihkan(m.id, 'kanan', 'badan')} anak="Right body" />
            <Cip aktif={punya(m.id, 'kiri', 'wajah')} onClick={() => alihkan(m.id, 'kiri', 'wajah')} anak="Left face" />
            <Cip aktif={punya(m.id, 'kanan', 'wajah')} onClick={() => alihkan(m.id, 'kanan', 'wajah')} anak="Right face" />
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <p className="text-[11.5px] font-black text-ink dark:text-white">Cranial nerve</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-neutral-500">
          A nucleus sits at one level, so this is what fixes the level.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[3, 7, 9, 12].map((n) => (
            <span key={n} className="flex gap-1">
              <Cip aktif={saraf.some((s) => s.saraf === n && s.sisi === 'kiri')}
                onClick={() => alihkanSaraf(n, 'kiri')} anak={`CN ${n} L`} />
              <Cip aktif={saraf.some((s) => s.saraf === n && s.sisi === 'kanan')}
                onClick={() => alihkanSaraf(n, 'kanan')} anak={`CN ${n} R`} />
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[10.5px] text-neutral-500">
          {[3, 7, 9, 12].map((n) => `CN ${n} → ${NAMA_TINGKAT[TINGKAT_SARAF_KRANIAL[n]]}`).join(' · ')}
        </p>
      </div>

      {/* Hasil */}
      {temuan.length === 0 && saraf.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-3 text-[12px] text-neutral-500 dark:border-white/15">
          Pick some findings, or run one of the cases above.
        </p>
      ) : hasil.tidakAdaLesiTunggal ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-3">
          <p className="text-[12px] font-black text-amber-800 dark:text-amber-200">No single lesion explains this</p>
          {hasil.catatan.map((c) => (
            <p key={c} className="mt-1 text-[11.5px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">{c}</p>
          ))}
        </div>
      ) : terbaik ? (
        <div className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Consistent with</p>
          <p className="text-[17px] font-black text-ink dark:text-white">
            {NAMA_TINGKAT[terbaik.tingkat]} · {terbaik.sisi === 'kiri' ? 'left' : 'right'}
          </p>
          <ul className="mt-2 space-y-1">
            {terbaik.alasan.map((a) => (
              <li key={a} className="text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-300">— {a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-[11.5px] font-black text-ink dark:text-white">
          What this deliberately does not model
        </summary>
        <ul className="mt-2 space-y-1">
          {DI_LUAR_MODEL.map((d) => (
            <li key={d} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">— {d}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}

export default LokalisasiLesiPanel
